// app.js - TermiTask Production Line Engine (Station 1)

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
    echoToTerminal('SYSTEM ONLINE: TermiTask v1.0', '#00ffff');
    echoToTerminal('Awaiting input... Type tasks to build schedule. Type "help" for options.', '#888888');

    // --- Station 1: Global Error Boundary & Input Loop ---
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

        // 0. Help Command (Placeholder for Station 3)
        if (lower === 'help') {
            echoToTerminal('Help system offline. Unlock Station 3 to enable guidance.', '#ff3333');
            return;
        }

        // 1. Clear Command (Placeholder for Station 2)
        if (lower === 'clear') {
            outputElement.innerHTML = '';
            appState.tasks = [];
            echoToTerminal('Terminal cleared. Queue reset.', '#ffb700');
            return;
        }

        // 2. Stop / End Command
        if (lower === 'stop' || lower === 'end' || lower === 'done') {
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

    // --- Display Helper ---
    function echoToTerminal(text, color = '#00ff66') {
        const div = document.createElement('div');
        div.style.color = color;
        div.style.whiteSpace = 'pre-wrap';
        div.textContent = text;
        outputElement.appendChild(div);
    }
});