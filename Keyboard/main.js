window.addEventListener("DOMContentLoaded", () => {
    
    const container = document.getElementById("keyboard");
    const instructions = document.getElementById("instructions");
    const lines = fetch("instructions.txt")
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
});