window.addEventListener("DOMContentLoaded", () => {
    const key = document.getElementById("C4");
    const note = document.getElementById("note");
    const sound = new Audio("C4.wav");
    let timePlayed;

    let keyDown = false;
    let mouseDown = false;
    let mouseHover = false;
    let keyPressed = false;

    window.addEventListener("mousedown", () => mouseDown = true);
    key.addEventListener("mousedown", () => pressKey());

    window.addEventListener("mouseup", () => mouseDown = false);
    key.addEventListener("mouseup", () => {if (!keyDown) releaseKey();});

    window.addEventListener("blur", () => mouseDown = false);
    window.addEventListener("pointercancel", () => { mouseDown = false; });
    document.addEventListener("visibilitychange", () => {
    if (document.hidden) mouseDown = false;
    });
    window.addEventListener("contextmenu", () => { mouseDown = false; });

    key.addEventListener("mouseenter", () => {
        mouseHover = true;
        updateNote();
        if (mouseDown) pressKey();
    });
    key.addEventListener("mouseleave", () => {
        mouseHover = false;
        if (!keyDown) releaseKey();
    });
  
    window.addEventListener("keydown", (e) => {
        if (e.key === "a") {
            pressKey();
            keyDown = true;
        }
    });
    
    window.addEventListener("keyup", (e) => {
        if (e.key === "a") {
            keyDown = false;
            if ((!mouseDown) || (mouseDown && !mouseHover)) releaseKey();
        }
    });

    function pressKey() {
        if (keyPressed && !keyDown) {
            release();
            setTimeout(() => {
                press();
                play();
                updateNote();
            }, 75);
        } else if (!keyDown) {
            press();
            play();
            updateNote();
        }
    }

    function releaseKey() {
        release();
        if (!mouseHover) clearNote();
        unplay();
    }

    function press() {
        key.classList.add("pressed");
        keyPressed = true;
    }
    function release() {
        key.classList.remove("pressed");
        keyPressed = false;
    }

    function play() {
        sound.currentTime = 1;
        sound.volume = 1;
        sound.play();
        timePlayed = performance.now();
    }
    function unplay() {
        const elapsed = performance.now() - timePlayed;
        if (elapsed < 100) {
            setTimeout(() => fadeOut(), 100 - elapsed);
        } else fadeOut();
    }

    function fadeOut() {
        const fade = setInterval(() => {
            if (sound.volume - 0.1 > 0) {
                sound.volume -= 0.1;
            } else {
                sound.volume = 0;
                sound.pause();
                clearInterval(fade);
            }
        }, 10);
    }

    function updateNote() {note.textContent = key.id;}
    function clearNote() {note.textContent = "";}
});
