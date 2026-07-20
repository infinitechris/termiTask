import { handleOrderMode } from './orderMode.js';
import { handleTaskEntry } from './tasks.js';
import { handleCommands } from './utils.js';

export let saved = JSON.parse(localStorage.getItem('tasks') || '[]');
export let output, input, activeText;
export let state = { step: 0, entry: {}, orderMode: false, subStep: 0, currentOrder: {} };

function processInput() {
    const val = input.value.trim();
    if (!val) return;
    try {
        if (state.orderMode) {
            handleOrderMode(val);
        } else {
            const handled = handleCommands(val);
            if (!handled) {
                handleTaskEntry(val);
            }
        }
        input.value = '';
    } catch (err) {
        output.innerHTML += `<div style="color: red;">[ERROR] ${err.message}</div>`;
    }
    window.scrollTo(0, document.body.scrollHeight);
}

document.addEventListener('DOMContentLoaded', () => {
    output = document.getElementById('output');
    input = document.getElementById('cmd');
    activeText = document.getElementById('active-text');

    if (!input || !output) {
        document.body.innerHTML += `<div style="color: red;">[CRITICAL] Elements #cmd or #output not found!</div>`;
        return;
    }

    saved.forEach(s => output.innerHTML += `<div class="log-entry">[SAVED] ${s}</div>`);

    // Handle desktop keydown
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            processInput();
        }
    });

    // Handle mobile virtual keyboard "Go" / "Enter" actions via input change or form submission if wrapped
    input.addEventListener('search', () => {
        processInput();
    });
});
