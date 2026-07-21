// app.js - TermiTask Production Line Engine (Product Pull Sub-Loop with Summation)

document.addEventListener('DOMContentLoaded', () => {
    const cmdInput = document.getElementById('cmd');
    const outputElement = document.getElementById('output');

    // Central application state
    const appState = {
        tasks: [],
        // Sub-loop state for T/C product pulling
        subLoopActive: false,
        pendingOrderType: null,
        pendingStartTime: null,
        pulledQuantitySum: 0
    };

    // Keep focus locked on the input box
    document.addEventListener('click', () => cmdInput.focus());

    // Boot message
    echoToTerminal('SYSTEM ONLINE: TermiTask v1.0 [Product Summation Active]', '#00ffff');
    echoToTerminal('Awaiting input... Type tasks to build schedule. Type "help" for options.', '#888888');

    // --- Global Error Boundary & Input Loop ---
    cmdInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const rawInput = cmdInput.value;
            const input = rawInput.trim();

            if (!input && !appState.subLoopActive) return;

            // Echo user prompt (if not waiting for sub-loop quantity input)
            if (!appState.subLoopActive && input) {
                echoToTerminal(`> ${input}`, '#ffb700');
            }

            try {
                if (appState.subLoopActive) {
                    handleSubLoopInput(input);
                } else {
                    handleInput(input);
                }
            } catch (error) {
                console.error("Terminal Error:", error);
                echoToTerminal(`[SYSTEM FAULT] ${error.message || 'An unexpected error occurred.'}`, '#ff3333');
                appState.subLoopActive = false; // Reset sub-loop on fault
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

        // 0. Help Command (Placeholder for Station 3)
        if (cmd === 'help') {
            echoToTerminal('Help system offline. Unlock Station 3 to enable guidance.', '#ff3333');
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

        // 3. Edit Command
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

        // --- Task Entry Parsing: Check for Optional Start Time ---
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        let startTime = null;
        let taskDescriptionParts = parts;

        if (timeRegex.test(parts[0])) {
            startTime = parts[0];
            taskDescriptionParts = parts.slice(1);
        }

        const taskTypeCandidate = taskDescriptionParts.join(' ').trim().toUpperCase();

        // --- Trigger Product Pull Sub-Loop for 'T' or 'C' ---
        if ((taskTypeCandidate === 'T' || taskTypeCandidate === 'C') && taskDescriptionParts.length === 1) {
            appState.subLoopActive = true;
            appState.pendingOrderType = taskTypeCandidate;
            appState.pendingStartTime = startTime;
            appState.pulledQuantitySum = 0;

            echoToTerminal(`> ${text}`, '#ffb700');
            echoToTerminal(`--- Order [${taskTypeCandidate}] Product Pull Initiated ---`, '#00ffff');
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

    // --- Product Pull Sub-Loop Handler with Summation ---
    function handleSubLoopInput(input) {
        const lower = input.toLowerCase();

        if (!input || lower === 'done' || lower === 'finish') {
            appState.subLoopActive = false;
            const orderType = appState.pendingOrderType;
            const startTime = appState.pendingStartTime || getSystemTime();

            const finalDescription = `Order ${orderType} [Pulled Qty: ${appState.pulledQuantitySum}]`;

            commitNewTask(finalDescription, startTime);
            appState.pendingOrderType = null;
            appState.pendingStartTime = null;
            appState.pulledQuantitySum = 0;
            return;
        }

        // Parse quantity and add to running sum
        const qty = parseFloat(input);
        if (isNaN(qty)) {
            echoToTerminal(`[ERROR] Invalid quantity "${input}". Please enter a valid number or type "done".`, '#ff3333');
            return;
        }

        appState.pulledQuantitySum += qty;
        echoToTerminal(`> [Qty] ${input}`, '#ffb700');
        echoToTerminal(`[Running Total: ${appState.pulledQuantitySum}] Enter next quantity or type "done".`, '#888888');
    }

    // --- Core Task Commitment Helper ---
    function commitNewTask(text, startTime) {
        const newTask = {
            text: text,
            start: startTime,
            end: null
        };

        // Automatic closure of the previous running task
        if (appState.tasks.length > 0) {
            const prevTask = appState.tasks[appState.tasks.length - 1];
            if (!prevTask.end) {
                prevTask.end = startTime;
            }
        }

        appState.tasks.push(newTask);
        echoToTerminal(`[${startTime}] Task Queued: ${text}`, '#00ff66');
    }

    function getSystemTime() {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
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
            echoToTerminal('[ERROR] Syntax: edit <number> [start|end|HH:MM] <new text>', '#ff3333');
            return;
        }

        const index = parseInt(parts[1], 10) - 1;
        if (isNaN(index) || index < 0 || index >= appState.tasks.length) {
            echoToTerminal(`[ERROR] Invalid task index: ${parts[1]}`, '#ff3333');
            return;
        }

        const task = appState.tasks[index];
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

        if (parts.length >= 4 && (parts[2].toLowerCase() === 'start' || parts[2].toLowerCase() === 'end')) {
            const targetField = parts[2].toLowerCase();
            const newTime = parts[3];

            if (!timeRegex.test(newTime)) {
                echoToTerminal(`[ERROR] Invalid 24-hour time format: "${newTime}". Use HH:MM.`, '#ff3333');
                return;
            }

            const oldTime = task[targetField] || 'IN PROGRESS';
            task[targetField] = newTime;
            
            let updateMsg = `[SUCCESS] Task #${index + 1} ${targetField} time updated: ${oldTime} -> ${newTime}`;
            if (parts.length > 4) {
                const newText = parts.slice(4).join(' ');
                const oldText = task.text;
                task.text = newText;
                updateMsg += ` | Text updated: "${oldText}" -> "${newText}"`;
            }

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
            echoToTerminal('  > clear everything  (wipes screen and deletes task queue)', '#888888');
            return;
        }

        if (target === 'everything' || target === 'all') {
            outputElement.innerHTML = '';
            appState.tasks = [];
            echoToTerminal('[SYSTEM] Complete wipe executed. Screen cleared and queue reset.', '#ff3333');
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
            echoToTerminal('[INFO] Current session is already idle. No running task to close.', '#888888');
            return;
        }

        const endTime = getSystemTime();
        lastTask.end = endTime;

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