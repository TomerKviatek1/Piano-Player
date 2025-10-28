class Keyboard {
    NOTES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"];
    STARTING_OCTAVE = 4;
    MIN_OCTAVE = 0;
    MAX_OCTAVE = 7;
    MAPPING = Mappings.letterToNote;

    static #instance = null;

    noteToKey = {};
    elementToKey = new Map();
    keyHovered;

    constructor(container) {
        if (Keyboard.#instance) return Keyboard.#instance;
        this.container = container
        this.mouseDown = false;
        this.keysDown = new Set();
        this.lettersDown = new Set();
        this.currOctave = this.STARTING_OCTAVE;
        this.display = document.getElementById("text");
        
        Keyboard.#instance = this;
        this.buildKeys();

        this.createEvents();
    }

    createEvents() {
        window.addEventListener("mousedown", () => this.mouseDown = true);
        this.container.addEventListener("mousedown", (e) => {
            const keyElement = e.target.closest(".key");
            if (keyElement && this.elementToKey.has(keyElement)) {
                const currKey = this.elementToKey.get(keyElement);
                this.pressKey(currKey);
            }
        });

        window.addEventListener("mouseup", () => this.mouseDown = false);
        this.container.addEventListener("mouseup", (e) => {
            const keyElement = e.target.closest(".key");
            if (keyElement && this.elementToKey.has(keyElement)) {
                const currKey = this.elementToKey.get(keyElement);
                this.releaseKey(currKey);
            }
        });

        window.addEventListener("blur", () => this.mouseDown = false);
        window.addEventListener("pointercancel", () => this.mouseDown = false);
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) this.mouseDown = false;
        });
        window.addEventListener("contextmenu", () => this.mouseDown = false);
    
        window.addEventListener("keydown", (e) => {
            const lcKey = e.key.toLowerCase();
            if (lcKey in this.MAPPING) {
                const currNote = this.getNoteByLetter(lcKey);
                if (currNote in this.noteToKey) {
                    const currKey = this.noteToKey[currNote];
                    this.pressKey(currKey);
                    this.lettersDown.add(lcKey);
                }
            }
        });
        
        window.addEventListener("keyup", (e) => {
            const lcKey = e.key.toLowerCase();
            this.lettersDown.delete(lcKey);
            if (lcKey in this.MAPPING) {
                const currNote = this.getNoteByLetter(lcKey);
                if (currNote in this.noteToKey) {
                    const currKey = this.noteToKey[currNote];
                    if (!this.mouseDown) {
                        this.releaseKey(currKey);
                    } else if (this.keyHovered && this.keyHovered !== currKey) {
                        this.releaseKey(currKey);
                    }
                }
            }
        });

        window.addEventListener("keydown", (e) => {
            const lcKey = e.key.toLowerCase();
            if (lcKey === "x" && this.currOctave + 1 <= this.MAX_OCTAVE) {
                this.currOctave++;
                this.elementToKey.forEach((key) => key.updateLetter(this.currOctave));
            }
            else if (lcKey === "z" && this.currOctave - 1 >= this.MIN_OCTAVE) {
                this.currOctave--;
                this.elementToKey.forEach((key) => key.updateLetter(this.currOctave));
            }
        })
    }

    buildKeys() {
        let whiteKeyIndex = 0;

        this.NOTES.slice(9).forEach((note) => whiteKeyIndex = this.assembleKey(note, 0, whiteKeyIndex));

        for (let octave = 1; octave <= this.MAX_OCTAVE; octave++) {
            this.NOTES.forEach((note) => {
                whiteKeyIndex = this.assembleKey(note, octave, whiteKeyIndex);
            });
        }

        whiteKeyIndex = this.assembleKey(this.NOTES[0], 8, whiteKeyIndex);
    }

    assembleKey(note, octave, whiteKeyIndex) {
        const id = note + octave;
        const sound = new Audio("../sounds/" + encodeURIComponent(id) + ".wav");
        const color = (note.includes("#") || note.includes("b")) ? Color.BLACK : Color.WHITE;
                
        const keyElement = document.createElement("div");
        const reflection = document.createElement("div");
        keyElement.classList.add("key", color);
        reflection.classList.add("reflection", color);
        keyElement.appendChild(reflection);
               
        if (color === Color.BLACK) {
            const offset = whiteKeyIndex - 0.3;
            keyElement.style.left = "calc(" + offset + " * (100% / 52))";
        }

        this.container.appendChild(keyElement);

        const key = new Key(note, octave, color, sound, keyElement);
        this.noteToKey[id] = key;
        this.elementToKey.set(keyElement, key);

        return (color === Color.WHITE) ? whiteKeyIndex +1 : whiteKeyIndex;
    }

    static getInstance() {return Keyboard.#instance;}

    updateHoveredKey(key) {this.keyHovered = key;}

    pressKey(key) {
        this.keysDown.add(key);
        key.pressKey();
    }

    releaseKey(key) {
        this.keysDown.delete(key);
        key.releaseKey();
    }

    updateDisplay() {
        const text = Array.from(this.keysDown)
        .sort((a, b) => {
            return (a.getOctave() - b.getOctave() ||
            this.NOTES.indexOf(a.getNote()) - this.NOTES.indexOf(b.getNote())
            );
        })
        .map(key => key.getId())
        .join(" ");
        this.display.textContent = text;
    }

    getNoteByLetter(letter) {
        let currNote;
        if (this.MAPPING[letter].includes(".")) {
            currNote = this.MAPPING[letter].slice(0, -1) + (this.currOctave + 1);
        } else {
            currNote = this.MAPPING[letter] + this.currOctave;
        }
        return currNote;
    }
}