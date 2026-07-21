// tasks.js - Task handling and sequential timing logic

export function handleTaskEntry(inputVal, appState, outputElement) {
    try {
        let startTime;
        let taskText = inputVal.trim();

        // Check if a time was provided at the start (e.g., "10:00 Start working on project")
        const timeMatch = taskText.match(/^(\d{2}:\d{2})\s+(.+)$/);

        if (timeMatch) {
            startTime = timeMatch[1]; // Use manually specified 24h time
            taskText = timeMatch[2];   // Extract the actual task description
        } else {
            // Fallback to current system time if no manual time was prefixed
            const now = new Date();
            startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        }

        const newTask = {
            text: taskText,
            start: startTime,
            end: null
        };

        // Ensure tasks array exists
        if (!appState.tasks) {
            appState.tasks = [];
        }

        // If there is a previous task, close it out with the current start time
        if (appState.tasks.length > 0) {
            const prevTask = appState.tasks[appState.tasks.length - 1];
            if (prevTask && !prevTask.end) {
                prevTask.end = startTime;
            }
        }

        appState.tasks.push(newTask);
        return newTask;
    } catch (error) {
        console.error("Error in handleTaskEntry:", error);
        return {
            text: inputVal,
            start: "00:00",
            end: null
        };
    }
}