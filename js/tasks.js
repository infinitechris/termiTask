// engine.js - Core application entry point and event loop for termiTask

import { handleCommands, sanitizeInput } from './utils.js';
import { handleTaskEntry } from './tasks.js';

document.addEventListener('DOMContentLoaded', () => {
    const cmdInput = document.getElementById('cmd');
    const outputElement = document.getElementById('output');
    const activeText = document.getElementById('active-text');

    // Basic app state tracker for tasks and stats
    const appState = {
        tasks: []
    };

    // Auto-focus the input box on load and keep it focused
    if (cmdInput) {
        cmdInput.focus();
        document.addEventListener('click', () => cmdInput.focus());
    }

    if (cmdInput && outputElement) {
        cmdInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const rawValue = cmdInput.value;
                const cleanValue = sanitizeInput(rawValue);

                if (!cleanValue.trim()) return;

                // Echo the user command to the terminal output
                outputElement.innerHTML += `<div><span style="color: #ffb700;">></span> ${cleanValue}</div>`;

                // 1. First, check if it's a utility command (clear, matrix, stats, etc.)
                const wasHandled = handleCommands(cleanValue, outputElement, appState);

                // 2. If it wasn't a utility command, process it as a sequential task entry
                if (!wasHandled) {
                    const taskResult = handleTaskEntry(cleanValue, appState, outputElement);
                    outputElement.innerHTML += `<div style="color: #00ff66;">[${taskResult.start}] Started: ${taskResult.text}</div>`;
                }

                // Clear input and scroll output to the bottom
                cmdInput.value = '';
                outputElement.scrollTop = outputElement.scrollHeight;
            }
        });
    }
});