import { saved, output } from './engine.js';

export function handleCommands(val) {
    const cmd = val.toLowerCase();
    if (cmd === 'export') {
        const csv = "Start,Task,Detail,End\n" + saved.map(s => s.replace(/ \| /g, ',')).join("\n");
        const link = document.createElement("a"); link.href = "data:text/csv," + encodeURI(csv); link.download = "tasks.csv"; link.click();
        return true;
    }
    if (cmd === 'clear') {
        if(confirm("Clear all data?")) { localStorage.removeItem('tasks'); location.reload(); }
        return true;
    }
    if (cmd === 'stats') {
        let total = 0; saved.forEach(s => { const m = s.match(/Total:(\d+)/); if(m) total += parseInt(m[1]); });
        output.innerHTML += `<div>[STATS] Total Pieces: ${total}</div>`;
        return true;
    }
    return false;
}