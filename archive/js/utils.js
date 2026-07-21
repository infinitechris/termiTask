// utils.js - General utility functions and command handlers for termiTask

export function handleCommands(cmd, outputElement, appState) {
    const cleanCmd = cmd.trim().toLowerCase();

    // Matrix Easter Egg
    if (cleanCmd === 'matrix') {
        runMatrixEffect(outputElement);
        return true; 
    }

    // Clear Terminal Output
    if (cleanCmd === 'clear') {
        outputElement.innerHTML = '';
        return true;
    }

    // Stats Command Loop
    if (cleanCmd === 'stats') {
        displayStats(outputElement, appState);
        return true;
    }
    
    // Command not recognized here
    return false;
}

function runMatrixEffect(outputElement) {
    outputElement.innerHTML += `<div style="color: #00ff66;">[SYSTEM] Entering the Matrix...</div>`;
    
    let drops = 0;
    const interval = setInterval(() => {
        const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        outputElement.innerHTML += `<div style="color: #003311; text-shadow: 0 0 5px #00ff66;">${randomString}</div>`;
        outputElement.scrollTop = outputElement.scrollHeight;
        
        drops++;
        if (drops > 15) {
            clearInterval(interval);
            outputElement.innerHTML += `<div style="color: #00ff66;">[SYSTEM] Connection closed. Welcome back.</div>`;
            outputElement.scrollTop = outputElement.scrollHeight;
        }
    }, 100);
}

function displayStats(outputElement, appState) {
    // Basic stats output fallback if appState tracks task counts
    const totalTasks = appState && appState.tasks ? appState.tasks.length : 0;
    outputElement.innerHTML += `<div style="color: #ffb700;">[STATS] Total tasks logged: ${totalTasks}</div>`;
    outputElement.scrollTop = outputElement.scrollHeight;
}

// Format current time into a clean 24-hour string (HH:MM)
export function getFormattedTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Sanitize user input to prevent HTML injection in the terminal output
export function sanitizeInput(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}