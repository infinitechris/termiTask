import { state, output, activeText, saved } from './engine.js';

export function handleTaskEntry(inputVal) {
    // Example: parse input to see if a manual time was provided (e.g., "Finish report @ 14:30")
    const timeMatch = inputVal.match(/@\s*(\d{2}:\d{2})/);
    
    let taskText = inputVal;
    let taskTime;

    if (timeMatch) {
        taskTime = timeMatch[1]; // Use manually specified 24h time
        taskText = inputVal.replace(timeMatch[0], '').trim(); // Strip time from task name
    } else {
        // Fallback to current time in your preferred 24h format
        const now = new Date();
        taskTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    return {
        text: taskText,
        time: taskTime
    };
}