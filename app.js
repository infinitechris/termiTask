// app.js - TermiTask Production Line Engine (v1.0 + Confirmation Clear Engine)

document.addEventListener('DOMContentLoaded', () => {
    const cmdInput = document.getElementById('cmd');
    const outputElement = document.getElementById('output');

    // Central application state
    const appState = {
        tasks: [],
        pendingAction: null // Tracks active confirmation prompts ('clear')
    };

    // Keep focus locked on the input box
    document.addEventListener('click', () => cmdInput.focus());

    // Boot message
    echoToTerminal('SYSTEM ONLINE: TermiTask v1.0', '#00ffff');
    echoToTerminal('Awaiting input... Type tasks to build schedule. Type "help" for options.', '#888888');

    // Main input loop with global error boundary
    cmdInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const rawInput = cmdInput.value;
            const input = rawInput.trim();

            if (!input && !appState.pendingAction) return;

            // Echo the user prompt if something was typed
            if (input) {
                echoToTerminal(`> ${input}`, '#ffb700');
            }

            try {
                handleInput(input);
            } catch (error) {
                console.error("Terminal Error:", error);
                echoToTerminal(`[SYSTEM FAULT] ${error.message || 'An unexpected error occurred.'}`, '#ff3333');
            }

            // Reset input box and snap scroll to the bottom
            cmdInput.value = '';
            outputElement.scrollTop = outputElement.scrollHeight;
        }
    });

    // --- Command Router ---
    function handleInput(text) {
        const lower = text.toLowerCase();

        // Check if we are waiting for a confirmation response
        if (appState.pendingAction === 'clear_confirm') {
            handleClearConfirmation(lower);
            return;
        }

        // 0. Help Command
        if (lower === 'help') {
            printHelpMenu();
            return;
        }

        // 1. Clear Command (Triggers confirmation flow)
        if (lower === 'clear') {
            appState.pendingAction = 'clear_confirm';
            echoToTerminal('--- CONFIRM CLEAR OPERATION ---', '#ff3333');
            echoToTerminal('Choose scope: [everything] (wipe tasks & screen), [screen] (wipe screen only), or [cancel]', '#ffb700');
            return;
        }

        // 2. Stop / End Command
        if (lower === 'stop' || lower === 'end' || lower === 'done') {
            handleStopCommand();
            return;
        }

        // 3. List Command
        if (lower === 'list' || lower === 'tasks') {
            printTaskList();
            return;
        }

        // 4. Preview/CSV Command
        if (lower === 'preview' || lower === 'csv') {
            printCsvPreview();
            return;
        }

        // 5. Stats / Status Command
        if (lower === 'stats' || lower === 'status') {
            printStats();
            return;
        }

        // 6. Edit Command (Format: edit <index> <new text>)
        if (lower.startsWith('edit ')) {
            handleEditCommand(text);
            return;
        }

        // --- Sequential Task Logic ---
        const now = new Date();
        const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

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
        echoToTerminal(`[${startTime}] Task Queued: ${text}`, '#00ff66');
    }

    // --- Clear Confirmation Handler ---
    function handleClearConfirmation(choice) {
        appState.pendingAction = null; // Reset pending state

        if (choice === 'everything' || choice === 'all' || choice === 'e') {
            outputElement.innerHTML = '';
            appState.tasks = [];
            echoToTerminal('Terminal screen wiped. Task queue completely reset.', '#ff3333');
        } else if (choice === 'screen' || choice === 's') {
            outputElement.innerHTML = '';
            echoToTerminal('Terminal screen wiped. Active task queue preserved.', '#ffb700');
        } else if (choice === 'cancel' || choice === 'c' || choice === 'abort') {
            echoToTerminal('Clear operation cancelled.', '#00ff66');
        } else {
            echoToTerminal('[ERROR] Unrecognized choice. Clear operation aborted.', '#ff3333');
        }
    }

    // --- Help Menu ---
    function printHelpMenu() {
        echoToTerminal('=== AVAILABLE COMMANDS ===', '#ffb700');
        echoToTerminal('  help               - Displays this help menu', '#00ffff');
        echoToTerminal('  stop / end / done  - Closes out the current active task without starting a new one', '#00ffff');
        echoToTerminal('  list / tasks       - View current numbered task timeline', '#00ffff');
        echoToTerminal('  preview / csv      - Preview active timeline formatted as CSV data', '#00ffff');
        echoToTerminal('  stats / status     - Display total logged tasks and active task metrics', '#00ffff');
        echoToTerminal('  edit <num> <text>  - Modify an existing task description by index number', '#00ffff');
        echoToTerminal('  clear              - Prompts to wipe everything, just the screen, or cancel', '#ff3333');
        echoToTerminal('  [Any other text]   - Automatically queues a new sequential task', '#888888');
    }

    // --- Stop Command Logic ---
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

        const now = new Date();
        const endTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        lastTask.end = endTime;

        echoToTerminal(`[${endTime}] Active task closed. System idling.`, '#ffb700');
    }

    // --- Task Editing Logic ---
    function handleEditCommand(text) {
        const parts = text.trim().split(/\s+/);
        if (parts.length < 3) {
            echoToTerminal('Usage: edit <task_number> <new task description>', '#ff3333');
            return;
        }

        const index = parseInt(parts[1], 10) - 1;
        const newDescription = parts.slice(2).join(' ');

        if (isNaN(index) || index < 0 || index >= appState.tasks.length) {
            echoToTerminal(`[ERROR] Invalid task index: ${parts[1]}`, '#ff3333');
            return;
        }

        const targetTask = appState.tasks[index];
        const oldText = targetTask.text;
        targetTask.text = newDescription;

        echoToTerminal(`[UPDATED] Task #${index + 1}: "${oldText}" -> "${newDescription}"`, '#00ffff');
    }

    // --- Display & Rendering Helpers ---
    function printTaskList() {
        if (appState.tasks.length === 0) {
            echoToTerminal('No tasks recorded yet.', '#888888');
            return;
        }

        echoToTerminal('--- Current Task Schedule ---', '#ffb700');
        appState.tasks.forEach((t, index) => {
            const endTime = t.end ? t.end : 'RUNNING...';
            echoToTerminal(`[${index + 1}] [${t.start} -> ${endTime}] ${t.text}`, '#ffffff');
        });
    }

    function printCsvPreview() {
        if (appState.tasks.length === 0) {
            echoToTerminal('No data to preview.', '#888888');
            return;
        }

        echoToTerminal('--- CSV Export Preview ---', '#ff00ff');
        
        let csvString = 'Start,End,Task\n';
        appState.tasks.forEach((t) => {
            const endTime = t.end ? t.end : '';
            csvString += `${t.start},${endTime},"${t.text.replace(/"/g, '""')}"\n`;
        });

        csvString.trim().split('\n').forEach(line => {
            echoToTerminal(line, '#cccccc');
        });
    }

    function printStats() {
        const totalTasks = appState.tasks.length;
        const activeTask = totalTasks > 0 && !appState.tasks[totalTasks - 1].end ? appState.tasks[totalTasks - 1].text : 'None';
        
        echoToTerminal('=== SESSION STATUS ===', '#ffb700');
        echoToTerminal(`Total Tasks Logged: ${totalTasks}`, '#ffffff');
        echoToTerminal(`Current Active Task: ${activeTask}`, '#00ff66');
    }

    function echoToTerminal(text, color = '#00ff66') {
        const div = document.createElement('div');
        div.style.color = color;
        div.style.whiteSpace = 'pre-wrap';
        div.textContent = text;
        outputElement.appendChild(div);
    }
});