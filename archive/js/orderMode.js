import { state, output, input, activeText, saved } from './engine.js';

export function handleOrderMode(val) {
    if (state.subStep === 1) {
        state.currentOrder.id = val; state.subStep = 2;
        output.innerHTML += `<div>> ${val}</div><div>[SYSTEM] Initialized. Enter quantities:</div>`;
        activeText.innerText = `Order: ${val} | Total: 0`;
    } else if (state.subStep === 2) {
        if (val.toLowerCase() === 'done') {
            const end = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            const entryStr = `${state.currentOrder.start} | ${state.currentOrder.type[0]}${state.currentOrder.id} | Total:${state.currentOrder.totalQty} | End: ${end}`;
            output.innerHTML += `<div class="log-entry">[SAVED] ${entryStr}</div>`;
            saved.push(entryStr); localStorage.setItem('tasks', JSON.stringify(saved));
            state.orderMode = false; state.subStep = 0; activeText.innerText = "System Ready";
        } else if (!isNaN(parseInt(val))) {
            state.currentOrder.totalQty += parseInt(val);
            activeText.innerText = `Order: ${state.currentOrder.id} | Total: ${state.currentOrder.totalQty}`;
        }
    }
}