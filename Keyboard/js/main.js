window.addEventListener("DOMContentLoaded", () => {
    
    const container = document.getElementById("keyboard");
    const instructions = document.getElementById("instructions");
    const lines = fetch("misc/instructions.txt")
    .then(response => response.text())
    .then(text => {
        const lines = text.split("\n");
        lines.forEach((line) => {
            const p = document.createElement("p");
            p.textContent = line;
            instructions.appendChild(p);
        });
    });
    const keyboard = new Keyboard(container);
    const recordBtn = document.getElementById("record-btn");
    const timer = document.getElementById("timer");
    const recordingList = document.getElementById("recording-list");
    const namingPopup = document.getElementById("naming-popup"); 
    const recorder = new Recorder(recordBtn, timer, recordingList, namingPopup, keyboard);
});