import { state, output, activeText, saved } from './engine.js';

export function handleTaskEntry(val) {
    if (state.step === 0) {
        if (val.toLowerCase() === 't' || val.toLowerCase() === 'c') {
            state.orderMode = true; state.subStep = 1;
            state.currentOrder = { type: val === 't' ? 'Tech' : 'Contractor', totalQty: 0, start: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) };
            output.innerHTML += `<div>> ${val}</div><div>[SYSTEM] Enter ID:</div>`;
            return;
        }
        state.entry.start = val || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        state.step = 1; activeText.innerText = `Active: ${state.entry.start} | Task?`;
    } else if (state.step === 1) {
        state.entry.desc = val;
        state.step = /^\d+$/.test(val) ? 2 : 3;
        activeText.innerText = `Active: ${state.entry.start} | ${val} | Detail?`;
    } else if (state.step === 2) {
        state.entry.detail = val; state.step = 3;
    } else if (state.step === 3) {
        const end = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const entryStr = `${state.entry.start} | ${state.entry.desc} | ${state.entry.detail || val} ${state.entry.detail ? ' | ' + val : ''} | End: ${end}`;
        output.innerHTML += `<div class="log-entry">[SAVED] ${entryStr}</div>`;
        saved.push(entryStr); localStorage.setItem('tasks', JSON.stringify(saved));
        state.step = 0; state.entry = {}; activeText.innerText = "System Ready";
    }
}