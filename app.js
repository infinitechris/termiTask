// app.js - TermiTask Production Line Engine (Station 2 Complete)

document.addEventListener('DOMContentLoaded', () => {
    const cmdInput = document.getElementById('cmd');
    const outputElement = document.getElementById('output');

    // Central application state
    const appState = {
        tasks: []
    };

    // Keep focus locked on the input box
    document.addEventListener('click', () => cmdInput.focus());

    // Boot message
    echoToTerminal('SYSTEM ONLINE: TermiTask v1.0 [Station 2 Active]', '#00ffff');
    echoToTerminal('Awaiting input... Type tasks to build schedule. Type "help" for options.', '#888888');

    // --- Global Error Boundary & Input Loop ---
    cmdInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const rawInput = cmdInput.value;
            const input = rawInput.trim();

            if (!input) return;

            // Echo the user prompt
            echoToTerminal(`> ${input}`, '#ffb700');

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
        const parts = text.trim().split(/\s+/);
        const cmd = parts[0].toLowerCase();

        // 0. Help Command (Placeholder for Station 3)
        if (cmd === 'help') {
            echoToTerminal('Help system offline. Unlock Station 3 to enable guidance.', '#ff3333');
            return;
        }

        // --- Station 2: Review & Inspection Commands ---

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

        // 3. Edit Command (`edit <number> <new text>`)
        if (cmd === 'edit') {
            handleEditCommand(parts);
            return;
        }

        // 4. Stats / Status Command
        if (cmd === 'stats' || cmd === 'status') {
            handleStatsCommand();
            return;
        }

        // 5. Safe Clear Command (`clear [everything|screen|cancel]`)
        if (cmd === 'clear') {
            handleClearCommand(parts[1]);
            return;
        }

        // --- Core Task Engine: Stop / End Command ---
        if (cmd === 'stop' || cmd === 'end' || cmd === 'done') {
            handleStopCommand();
            return;
        }

        // --- Station 1: Automated 24-Hour Timestamp & Sequential Engine ---
        const now = new Date();
        const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

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
            echoToTerminal('[ERROR] Syntax: edit <number> <new description>', '#ff3333');
            return;
        }

        const index = parseInt(parts[1], 10) - 1;
        if (isNaN(index) || index < 0 || index >= appState.tasks.length) {
            echoToTerminal(`[ERROR] Invalid task index: ${parts[1]}`, '#ff3333');
            return;
        }

        const newText = parts.slice(2).join(' ');
        const oldText = appState.tasks[index].text;
        appState.tasks[index].text = newText;

        echoToTerminal(`[SUCCESS] Task #${index + 1} updated from "${oldText}" to "${newText}"`, '#00ff66');
    }

    function handleStatsCommand() {
        const totalTasks = appState.tasks.length;
        const completedTasks = appState.tasks.filter(t => t.end).inProgress || appState.tasks.filter(t => t.end).length;
        const activeTask = appState.tasks.find(t => !t.end);

        echoToTerminal('--- Session Metrics ---', '#00ffff');
        echoToTerminal(`Total Logged Entries: ${totalTasks}`, '#ffffff');
        echoToTerminal(`Completed Slots: ${completedTasks}`, '#ffffff');
        echoToTerminal(`Current Status: ${activeTask ? 'ACTIVE (' + activeTask.text + ')' : 'IDLE'}`, activeTask ? '#00ff66' : '#ffb700');
        echoToTerminal('-----------------------', '#00ffff');
    }

    function handleClearCommand(mode) {
        const target = (mode || 'screen').toLowerCase();

        if (target === 'everything' || target === 'all') {
            outputElement.innerHTML = '';
            appState.tasks = [];
            echoToTerminal('[SYSTEM] Complete wipe executed. Screen cleared and queue reset.', '#ff3333');
        } else if (target === 'screen') {
            outputElement.innerHTML = '';
            echoToTerminal('[SYSTEM] Terminal screen cleared. Queue preserved.', '#ffb700');
        } else if (target === 'cancel') {
            echoToTerminal('[INFO] Clear operation cancelled.', '#888888');
        } else {
            // Default safe prompt behavior if no valid modifier given
            outputElement.innerHTML = '';
            echoToTerminal('[SYSTEM] Terminal screen cleared. (Use "clear everything" to wipe data queue).', '#ffb700');
        }
    }

    // --- Core Task Engine: Stop Command ---
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

    // --- Display Helper ---
    function echoToTerminal(text, color = '#00ff66') {
        const div = document.createElement('div');
        div.style.color = color;
        div.style.whiteSpace = 'pre-wrap';
        div.textContent = text;
        outputElement.appendChild(div);
    }
});