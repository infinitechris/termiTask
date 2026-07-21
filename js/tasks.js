// tasks.js - Task handling and sequential timing logic

export function handleTaskEntry(inputVal, appState, outputElement) {
    const now = new Date();
    const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newTask = {
        text: inputVal.trim(),
        start: startTime,
        end: null
    };

    // If there is a previous task, close it out with the current start time
    if (appState.tasks.length > 0) {
        const prevTask = appState.tasks[appState.tasks.length - 1];
        if (!prevTask.end) {
            prevTask.end = startTime;
        }
    }

    appState.tasks.push(newTask);
    return newTask;
}