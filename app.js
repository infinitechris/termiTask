// app.js - TermiTask Production Line Engine (Sequential Push Hotfix)

document.addEventListener('DOMContentLoaded', () => {
    const cmdInput = document.getElementById('cmd');
    const outputElement = document.getElementById('output');

    // Central application state
    const appState = {
        tasks: [],
        // Sub-loop states (Product Pulls)
        subLoopActive: false,
        pendingOrderIdentifier: null,
        pendingStartTime: null,
        pulledQuantitySum: 0,
        // Deletion confirmation state
        pendingDeleteIndex: null,
        // GitHub Sync Configuration State
        syncConfiguring: false,
        syncStep: 0, // 1 = Token, 2 = Repository
        tempToken: null
    };

    // Keep focus locked on the input box
    document.addEventListener('click', () => cmdInput.focus());

    // Boot sequence: Load LocalStorage and check for remote sync
    loadTasksFromStorage();
    
    // Boot message
    echoToTerminal('SYSTEM ONLINE: TermiTask v1.0 [Sequential Push Patch]', '#00ffff');
    echoToTerminal('Awaiting input... Type tasks to build schedule. Type "help" for options.', '#888888');

    // --- Global Error Boundary & Input Loop ---
    cmdInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const rawInput = cmdInput.value;
            const input = rawInput.trim();

            const isBusy = appState.subLoopActive || appState.pendingDeleteIndex !== null || appState.syncConfiguring;

            if (!input && !isBusy) return;

            // Echo user prompt (if not waiting for multi-step input wizard)
            if (!isBusy && input) {
                echoToTerminal(`> ${input}`, '#ffb700');
            }

            try {
                if (appState.subLoopActive) {
                    handleSubLoopInput(input);
                } else if (appState.pendingDeleteIndex !== null) {
                    handleDeleteConfirmation(input);
                } else if (appState.syncConfiguring) {
                    handleSyncSetupInput(input);
                } else {
                    handleInput(input);
                }
            } catch (error) {
                console.error("Terminal Error:", error);
                echoToTerminal(`[SYSTEM FAULT] ${error.message || 'An unexpected error occurred.'}`, '#ff3333');
                appState.subLoopActive = false;
                appState.pendingDeleteIndex = null;
                appState.syncConfiguring = false;
            }

            // Reset input box and snap scroll to the bottom
            cmdInput.value = '';
            outputElement.scrollTop = outputElement.scrollHeight;
        }
    });

    // --- Command Router ---
    function handleInput(text) {
        const parts = text.trim().split(/\s+/);
        const cmd = parts[0].toLowerCase();

        // 0. Help Command
        if (cmd === 'help') {
            handleHelpCommand();
            return;
        }

        // 1. List / Tasks Command
        if (cmd === 'list' || cmd === 'tasks') {
            handleListCommand();
            return;
        }

        // 2. Preview / CSV Command
        if (cmd === 'preview' || cmd === 'csv') {
            handlePreviewCommand();
            return;
        }

        // 3. Edit Command (Includes Delete Routing)
        if (cmd === 'edit') {
            handleEditCommand(parts);
            return;
        }

        // 4. Stats / Status Command
        if (cmd === 'stats' || cmd === 'status') {
            handleStatsCommand();
            return;
        }

        // 5. Clear Command
        if (cmd === 'clear') {
            handleClearCommand(parts[1]);
            return;
        }

        // 6. Stop / End Command
        if (cmd === 'stop' || cmd === 'end' || cmd === 'done') {
            handleStopCommand();
            return;
        }

        // 7. Sync Commands (GitHub Integration)
        if (cmd === 'sync') {
            handleSyncCommand(parts);
            return;
        }

        // --- Task Entry Parsing: Check for Optional Start Time ---
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        let startTime = null;
        let taskDescriptionParts = parts;

        if (timeRegex.test(parts[0])) {
            startTime = parts[0];
            taskDescriptionParts = parts.slice(1);
        }

        const candidateToken = taskDescriptionParts.join(' ').trim();
        const upperCandidate = candidateToken.toUpperCase();

        // --- Enhanced T/C Order Validation & Sub-Loop Trigger ---
        const techOrderRegex = /^T\d{4}$/;
        const contractorOrderRegex = /^C-[A-Z]+$/i;

        const isStandaloneTC = (upperCandidate === 'T' || upperCandidate === 'C');
        const isTechOrder = techOrderRegex.test(upperCandidate);
        const isContractorOrder = contractorOrderRegex.test(candidateToken);

        if ((isStandaloneTC || isTechOrder || isContractorOrder) && taskDescriptionParts.length === 1) {
            appState.subLoopActive = true;
            appState.pendingOrderIdentifier = isStandaloneTC ? `Order ${upperCandidate}` : `Order ${candidateToken}`;
            appState.pendingStartTime = startTime;
            appState.pulledQuantitySum = 0;

            echoToTerminal(`--- ${appState.pendingOrderIdentifier} Product Pull Initiated ---`, '#00ffff');
            echoToTerminal('Enter quantities to sum. Type "done" or leave blank when finished.', '#888888');
            return;
        }

        // Fallback to current system clock if no start time provided
        if (!startTime) {
            startTime = getSystemTime();
        }

        const taskText = taskDescriptionParts.join(' ');
        if (!taskText) {
            echoToTerminal('[ERROR] Task description cannot be empty.', '#ff3333');
            return;
        }

        commitNewTask(taskText, startTime);
    }

    // --- Product Pull Sub-Loop Handler ---
    function handleSubLoopInput(input) {
        const lower = input.toLowerCase();

        if (!input || lower === 'done' || lower === 'finish') {
            appState.subLoopActive = false;
            const orderIdentifier = appState.pendingOrderIdentifier;
            const startTime = appState.pendingStartTime || getSystemTime();

            const finalDescription = `${orderIdentifier} [Pulled Qty: ${appState.pulledQuantitySum}]`;

            commitNewTask(finalDescription, startTime);
            appState.pendingOrderIdentifier = null;
            appState.pendingStartTime = null;
            appState.pulledQuantitySum = 0;
            return;
        }

        const qty = parseFloat(input);
        if (isNaN(qty)) {
            echoToTerminal(`> [Qty] ${input}`, '#ffb700');
            echoToTerminal(`[ERROR] Invalid quantity "${input}". Please enter a valid number or type "done".`, '#ff3333');
            return;
        }

        appState.pulledQuantitySum += qty;
        echoToTerminal(`> [Qty Added: ${qty}]`, '#ffb700');
        echoToTerminal(`[Running Total: ${appState.pulledQuantitySum}] Enter next quantity or type "done".`, '#888888');
    }

    // --- Core Task Commitment & Dual-Format Persistence Helpers ---
    function commitNewTask(text, startTime) {
        const newTask = {
            text: text,
            start: startTime,
            end: null
        };

        if (appState.tasks.length > 0) {
            const prevTask = appState.tasks[appState.tasks.length - 1];
            if (!prevTask.end) {
                prevTask.end = startTime;
            }
        }

        appState.tasks.push(newTask);
        saveTasksToStorage();
        echoToTerminal(`[${startTime}] Task Queued: ${text}`, '#00ff66');
    }

    function saveTasksToStorage() {
        try {
            // 1. Save JSON state locally
            localStorage.setItem('termitask_queue', JSON.stringify(appState.tasks));

            // 2. Generate and cache live CSV string automatically
            const csvRows = ['Start,End,Task'];
            appState.tasks.forEach(task => {
                const endTime = task.end || '';
                csvRows.push(`"${task.start}","${endTime}","${task.text}"`);
            });
            localStorage.setItem('termitask_csv_cache', csvRows.join('\n'));

        } catch (error) {
            console.error("Storage Fault:", error);
            echoToTerminal('[SYSTEM WARNING] Failed to persist tasks to LocalStorage.', '#ff3333');
        }
    }

    function loadTasksFromStorage() {
        try {
            const savedData = localStorage.getItem('termitask_queue');
            if (savedData) {
                appState.tasks = JSON.parse(savedData);
                if (appState.tasks.length > 0) {
                    echoToTerminal(`[SYSTEM] Restored ${appState.tasks.length} task(s) from local session.`, '#00ffff');
                }
            }
        } catch (error) {
            console.error("Load Fault:", error);
            echoToTerminal('[SYSTEM FAULT] Corrupted local storage detected. Initializing clean queue.', '#ff3333');
            localStorage.removeItem('termitask_queue');
            localStorage.removeItem('termitask_csv_cache');
        }
    }

    function getSystemTime() {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    // --- Station 4: GitHub Setup Wizard & Sync Diagnostics ---
    function handleSyncCommand(parts) {
        const subCmd = parts[1] ? parts[1].toLowerCase() : '';

        if (subCmd === 'setup') {
            appState.syncConfiguring = true;
            appState.syncStep = 1;
            appState.tempToken = null;
            echoToTerminal('--- GitHub Cloud Sync Setup Wizard ---', '#00ffff');
            echoToTerminal('Step 1/2: Paste your GitHub Personal Access Token (PAT):', '#ffb700');
            return;
        }

        if (subCmd === 'push') {
            pushStateToGitHub();
            return;
        }

        if (subCmd === 'pull') {
            pullStateFromGitHub();
            return;
        }

        if (subCmd === 'state') {
            handleSyncStateInspection();
            return;
        }

        const token = localStorage.getItem('termitask_gh_token');
        const repo = localStorage.getItem('termitask_gh_repo');
        echoToTerminal('--- GitHub Sync Status ---', '#00ffff');
        echoToTerminal(`Configured Repo: ${repo || 'None'}`, '#ffffff');
        echoToTerminal(`Token Stored: ${token ? 'YES (Active)' : 'NO'}`, token ? '#00ff66' : '#ff3333');
        echoToTerminal('Commands: sync setup | sync state | sync push | sync pull', '#888888');
        echoToTerminal('--------------------------', '#00ffff');
    }

    function handleSyncStateInspection() {
        const token = localStorage.getItem('termitask_gh_token');
        const repo = localStorage.getItem('termitask_gh_repo');
        const queueData = localStorage.getItem('termitask_queue');
        const csvCache = localStorage.getItem('termitask_csv_cache');

        echoToTerminal('--- Sync Diagnostics [sync state] ---', '#00ffff');
        echoToTerminal(`  [Credentials]:`, '#ffb700');
        echoToTerminal(`    Repository Target : ${repo || '[NOT SET]'}`, '#ffffff');
        echoToTerminal(`    Token Status      : ${token ? 'Present (' + token.length + ' chars)' : '[MISSING]'}`, token ? '#00ff66' : '#ff3333');
        
        echoToTerminal(`  [Local Storage Caches]:`, '#ffb700');
        echoToTerminal(`    Queue Payload Size: ${queueData ? queueData.length + ' bytes (' + appState.tasks.length + ' tasks)' : 'Empty'}`, '#ffffff');
        echoToTerminal(`    CSV Cache Status  : ${csvCache ? 'Cached (' + csvCache.split('\n').length + ' lines)' : 'Empty'}`, '#ffffff');
        
        echoToTerminal('---------------------------------------', '#00ffff');
    }

    function handleSyncSetupInput(input) {
        if (!input) {
            echoToTerminal('[ERROR] Input cannot be empty during setup.', '#ff3333');
            return;
        }

        if (appState.syncStep === 1) {
            appState.tempToken = input;
            appState.syncStep = 2;
            echoToTerminal('> [TOKEN SAVED SECURELY IN MEMORY]', '#00ff66');
            echoToTerminal('Step 2/2: Enter your private repository name (e.g., username/termitask-state):', '#ffb700');
            return;
        }

        if (appState.syncStep === 2) {
            const repoName = input;
            const token = appState.tempToken;

            appState.syncConfiguring = false;
            appState.syncStep = 0;
            appState.tempToken = null;

            localStorage.setItem('termitask_gh_token', token);
            localStorage.setItem('termitask_gh_repo', repoName);

            echoToTerminal(`> ${repoName}`, '#ffb700');
            echoToTerminal('[SUCCESS] GitHub credentials successfully locked in!', '#00ff66');
            echoToTerminal('Testing connection with a remote pull...', '#888888');
            pullStateFromGitHub();
        }
    }

    async function pushFileToGitHub(path, content, message, token, repo) {
        const url = `https://api.github.com/repos/${repo}/contents/${path}`;
        let sha = null;

        const getRes = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }
        });

        if (getRes.ok) {
            const fileData = await getRes.json();
            sha = fileData.sha;
        }

        const base64Content = btoa(unescape(encodeURIComponent(content)));
        const bodyData = { message: message, content: base64Content };
        if (sha) bodyData.sha = sha;

        const putRes = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        });

        if (!putRes.ok) {
            const errJson = await putRes.json();
            throw new Error(errJson.message || `Failed to push ${path}`);
        }
    }

    async function pushStateToGitHub() {
        const token = localStorage.getItem('termitask_gh_token');
        const repo = localStorage.getItem('termitask_gh_repo');

        if (!token || !repo) {
            echoToTerminal('[ERROR] GitHub sync not configured. Run "sync setup" first.', '#ff3333');
            return;
        }

        echoToTerminal('[SYNC] Pushing JSON state & CSV artifact to GitHub...', '#ffb700');

        try {
            const timestamp = new Date().toISOString();
            const jsonContent = JSON.stringify(appState.tasks, null, 2);
            const csvContent = localStorage.getItem('termitask_csv_cache') || 'Start,End,Task';

            // Push sequentially to prevent concurrent file tree SHA collisions
            await pushFileToGitHub('state.json', jsonContent, `TermiTask State Auto-Sync: ${timestamp}`, token, repo);
            await pushFileToGitHub('log.csv', csvContent, `TermiTask CSV Artifact Auto-Sync: ${timestamp}`, token, repo);

            echoToTerminal('[SUCCESS] state.json and log.csv successfully pushed to GitHub!', '#00ff66');
        } catch (error) {
            console.error("GitHub Push Error:", error);
            echoToTerminal(`[SYNC FAULT] Push failed: ${error.message}`, '#ff3333');
        }
    }

    async function pullStateFromGitHub() {
        const token = localStorage.getItem('termitask_gh_token');
        const repo = localStorage.getItem('termitask_gh_repo');

        if (!token || !repo) {
            echoToTerminal('[ERROR] GitHub sync not configured. Run "sync setup" first.', '#ff3333');
            return;
        }

        echoToTerminal('[SYNC] Pulling state from GitHub...', '#ffb700');

        try {
            const path = 'state.json';
            const url = `https://api.github.com/repos/${repo}/contents/${path}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }
            });

            if (res.status === 404) {
                echoToTerminal('[INFO] Remote repository state file not found yet. Run "sync push" to initialize it.', '#ffb700');
                return;
            }

            if (!res.ok) {
                const errJson = await res.json();
                throw new Error(errJson.message || 'GitHub API rejected pull request.');
            }

            const fileData = await res.json();
            const decodedJson = decodeURIComponent(escape(atob(fileData.content)));
            const remoteTasks = JSON.parse(decodedJson);

            if (Array.isArray(remoteTasks)) {
                appState.tasks = remoteTasks;
                saveTasksToStorage();
                echoToTerminal(`[SUCCESS] Pulled and loaded ${appState.tasks.length} task(s) from GitHub!`, '#00ff66');
            } else {
                throw new Error('Invalid task array structure in remote state file.');
            }
        } catch (error) {
            console.error("GitHub Pull Error:", error);
            echoToTerminal(`[SYNC FAULT] Pull failed: ${error.message}`, '#ff3333');
        }
    }

    // --- Station 3 Feature Handler: Help System ---
    function handleHelpCommand() {
        echoToTerminal('--- TermiTask Command Directory ---', '#00ffff');
        echoToTerminal('  [Task Entry]:', '#ffb700');
        echoToTerminal('    <text>                 Start a standard task (auto timestamp)', '#ffffff');
        echoToTerminal('    [HH:MM] <text>         Start a task with an explicit 24h start time', '#ffffff');
        echoToTerminal('    T<4 digits> / C-<name> Trigger product pull sub-loop (e.g. T1030, C-PBIT)', '#ffffff');
        echoToTerminal('    done / stop / end      Close current running task / sub-loop', '#ffffff');
        echoToTerminal('  [Inspection & Review]:', '#ffb700');
        echoToTerminal('    list (or tasks)        View active timeline and indices', '#ffffff');
        echoToTerminal('    preview (or csv)       Inspect raw CSV output string layout', '#ffffff');
        echoToTerminal('    stats (or status)      View session summary metrics', '#ffffff');
        echoToTerminal('  [Editing & Maintenance]:', '#ffb700');
        echoToTerminal('    edit <num> <text>      Update task description text', '#ffffff');
        echoToTerminal('    edit <num> start HH:MM Override start time', '#ffffff');
        echoToTerminal('    edit <num> end HH:MM   Override end time', '#ffffff');
        echoToTerminal('    edit <num> delete      Permanently delete task (with confirmation)', '#ffffff');
        echoToTerminal('    clear screen           Clear terminal view, preserve queue', '#ffffff');
        echoToTerminal('    clear everything       Wipe screen and reset task queue/storage', '#ffffff');
        echoToTerminal('  [Cloud Sync (GitHub)]:', '#ffb700');
        echoToTerminal('    sync                   Check current repository sync status', '#ffffff');
        echoToTerminal('    sync state             View detailed sync diagnostics & storage health', '#ffffff');
        echoToTerminal('    sync setup             Interactive setup wizard for GitHub PAT', '#ffffff');
        echoToTerminal('    sync push              Upload JSON state & auto-CSV log to repo', '#ffffff');
        echoToTerminal('    sync pull              Download remote state from repo', '#ffffff');
        echoToTerminal('------------------------------------', '#00ffff');
    }

    // --- Station 2 Feature Handlers ---

    function handleListCommand() {
        if (appState.tasks.length === 0) {
            echoToTerminal('[INFO] Task queue is currently empty.', '#888888');
            return;
        }

        echoToTerminal('--- Active Timeline ---', '#00ffff');
        appState.tasks.forEach((task, index) => {
            const endTime = task.end || 'IN PROGRESS';
            echoToTerminal(`  [${index + 1}] ${task.start} - ${endTime} : ${task.text}`, '#00ff66');
        });
        echoToTerminal('-----------------------', '#00ffff');
    }

    function handlePreviewCommand() {
        if (appState.tasks.length === 0) {
            echoToTerminal('[INFO] No data available for CSV preview.', '#888888');
            return;
        }

        echoToTerminal('--- CSV Stream Preview ---', '#ffb700');
        echoToTerminal('Start,End,Task', '#888888');
        appState.tasks.forEach(task => {
            const endTime = task.end || '';
            echoToTerminal(`"${task.start}","${endTime}","${task.text}"`, '#ffffff');
        });
        echoToTerminal('--------------------------', '#ffb700');
    }

    function handleEditCommand(parts) {
        if (parts.length < 3) {
            echoToTerminal('[ERROR] Syntax: edit <number> [start|end|delete|HH:MM] <new text>', '#ff3333');
            return;
        }

        const index = parseInt(parts[1], 10) - 1;
        if (isNaN(index) || index < 0 || index >= appState.tasks.length) {
            echoToTerminal(`[ERROR] Invalid task index: ${parts[1]}`, '#ff3333');
            return;
        }

        const task = appState.tasks[index];
        const actionOrField = parts[2].toLowerCase();

        // --- Handle Delete Request ---
        if (actionOrField === 'delete' || actionOrField === 'del' || actionOrField === 'remove') {
            appState.pendingDeleteIndex = index;
            echoToTerminal(`> edit ${parts[1]} delete`, '#ffb700');
            echoToTerminal(`[WARNING] Are you sure you want to delete Task #${index + 1}: "${task.text}"? (y/n)`, '#ff3333');
            return;
        }

        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

        if (actionOrField === 'start' || actionOrField === 'end') {
            if (parts.length < 4) {
                echoToTerminal(`[ERROR] Missing time value for ${actionOrField}. Syntax: edit <number> ${actionOrField} HH:MM`, '#ff3333');
                return;
            }
            const newTime = parts[3];

            if (!timeRegex.test(newTime)) {
                echoToTerminal(`[ERROR] Invalid 24-hour time format: "${newTime}". Use HH:MM.`, '#ff3333');
                return;
            }

            const oldTime = task[actionOrField] || 'IN PROGRESS';
            task[actionOrField] = newTime;
            
            let updateMsg = `[SUCCESS] Task #${index + 1} ${actionOrField} time updated: ${oldTime} -> ${newTime}`;
            if (parts.length > 4) {
                const newText = parts.slice(4).join(' ');
                const oldText = task.text;
                task.text = newText;
                updateMsg += ` | Text updated: "${oldText}" -> "${newText}"`;
            }

            saveTasksToStorage();
            echoToTerminal(updateMsg, '#00ff66');
            return;
        }

        if (parts.length === 3 && timeRegex.test(parts[2])) {
            const timeVal = parts[2];
            echoToTerminal(`[WARN] Ambiguous timestamp for Task #${index + 1}. Do you want to update the start or end time?`, '#ffb700');
            echoToTerminal(`  > edit ${index + 1} start ${timeVal}`, '#888888');
            echoToTerminal(`  > edit ${index + 1} end ${timeVal}`, '#888888');
            return;
        }

        let newStart = null;
        let textStartIndex = 2;

        if (timeRegex.test(parts[2])) {
            newStart = parts[2];
            textStartIndex = 3;
        }

        if (parts.length <= textStartIndex) {
            echoToTerminal('[ERROR] Missing new task description.', '#ff3333');
            return;
        }

        const newText = parts.slice(textStartIndex).join(' ');
        const oldText = task.text;
        const oldStart = task.start;

        task.text = newText;
        if (newStart) {
            task.start = newStart;
            echoToTerminal(`[SUCCESS] Task #${index + 1} updated | Time: ${oldStart} -> ${newStart} | Text: "${oldText}" -> "${newText}"`, '#00ff66');
        } else {
            echoToTerminal(`[SUCCESS] Task #${index + 1} text updated from "${oldText}" to "${newText}"`, '#00ff66');
        }
        saveTasksToStorage();
    }

    // --- Delete Confirmation Handler ---
    function handleDeleteConfirmation(input) {
        const lower = input.trim().toLowerCase();
        const index = appState.pendingDeleteIndex;

        echoToTerminal(`> ${input}`, '#ffb700');

        if (lower === 'y' || lower === 'yes') {
            const removedTask = appState.tasks.splice(index, 1)[0];
            saveTasksToStorage();
            echoToTerminal(`[SUCCESS] Task #${index + 1} ("${removedTask.text}") permanently deleted.`, '#ff3333');
        } else {
            echoToTerminal(`[CANCELLED] Deletion aborted. Task queue unchanged.`, '#00ff66');
        }

        appState.pendingDeleteIndex = null;
    }

    function handleStatsCommand() {
        const totalTasks = appState.tasks.length;
        const completedTasks = appState.tasks.filter(t => t.end).length;
        const activeTask = appState.tasks.find(t => !t.end);

        echoToTerminal('--- Session Metrics ---', '#00ffff');
        echoToTerminal(`Total Logged Entries: ${totalTasks}`, '#ffffff');
        echoToTerminal(`Completed Slots: ${completedTasks}`, '#ffffff');
        echoToTerminal(`Current Status: ${activeTask ? 'ACTIVE (' + activeTask.text + ')' : 'IDLE'}`, activeTask ? '#00ff66' : '#ffb700');
        echoToTerminal('-----------------------', '#00ffff');
    }

    function handleClearCommand(mode) {
        const target = mode ? mode.toLowerCase() : null;

        if (!target) {
            echoToTerminal('[WARN] Safe clear initiated. Choose an option:', '#ffb700');
            echoToTerminal('  > clear screen      (clears view, preserves task queue)', '#888888');
            echoToTerminal('  > clear everything  (wipes screen and deletes task queue/storage)', '#ff3333');
            return;
        }

        if (target === 'everything' || target === 'all') {
            outputElement.innerHTML = '';
            appState.tasks = [];
            localStorage.removeItem('termitask_queue');
            localStorage.removeItem('termitask_csv_cache');
            echoToTerminal('[SYSTEM] Complete wipe executed. Screen cleared and storage reset.', '#ff3333');
        } else if (target === 'screen') {
            outputElement.innerHTML = '';
            echoToTerminal('[SYSTEM] Terminal screen cleared. Queue preserved.', '#ffb700');
        } else {
            echoToTerminal(`[ERROR] Unknown clear modifier "${mode}". Use: screen or everything.`, '#ff3333');
        }
    }

    function handleStopCommand() {
        if (appState.tasks.length === 0) {
            echoToTerminal('[INFO] No active tasks to stop.', '#888888');
            return;
        }

        const lastTask = appState.tasks[appState.tasks.length - 1];
        if (lastTask.end) {
            echoToTerminal('[INFO] Current session is already idle. No running task to close.', '#ffb700');
            return;
        }

        const endTime = getSystemTime();
        lastTask.end = endTime;
        saveTasksToStorage();

        echoToTerminal(`[${endTime}] Active task closed. System idling.`, '#ffb700');
    }

    function echoToTerminal(text, color = '#00ff66') {
        const div = document.createElement('div');
        div.style.color = color;
        div.style.whiteSpace = 'pre-wrap';
        div.textContent = text;
        outputElement.appendChild(div);
    }
});