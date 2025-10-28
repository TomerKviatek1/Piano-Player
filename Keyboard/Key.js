class Key {
    #note;
    #octave;
    #color;
    #sound;
    #id;
    #element;
    #timePlayed = 0;
    #letter;
    keyboard;
    isPressed = false;

    constructor(note, octave, color, sound, element) {
        this.#note = note;
        this.#octave = octave;
        this.#color = color;
        this.#sound = sound;
        this.#id = this.#note + this.#octave;
        this.#element = element;
        this.updateLetter(4);
    }

    getNote() {return this.#note;}
    getOctave() {return this.#octave;}
    getColor() {return this.#color;}
    getSound() {return this.#sound;}
    getId() {return this.#id;}
    getElement() {return this.#element;}
    getLetter() {return this.#letter;}

    createEvents() {
        this.keyboard = Keyboard.getInstance();

        this.#element.addEventListener("mouseenter", () => {
            this.keyboard.updateHoveredKey(this);
            if (this.keyboard.mouseDown) this.keyboard.pressKey(this);
        });
        this.#element.addEventListener("mouseleave", () => {
            this.keyboard.updateHoveredKey(null);
            if (!this.keyboard.lettersDown.has(this.#letter)) this.keyboard.releaseKey(this);
        });
    }

    pressKey() {
        if (this.isPressed && !this.keyboard.lettersDown.has(this.#letter)) {
            this.release();
            setTimeout(() => {
                this.press();
                this.play();
                this.keyboard.updateDisplay();
                
            }, 75);
        } else if (!this.keyboard.lettersDown.has(this.#letter)) {
            this.press();
            this.play();
            this.keyboard.updateDisplay();
        }
    }

    releaseKey() {
        this.release();
        this.unplay();
        this.keyboard.updateDisplay();
    }

    press() {
        this.#element.classList.add("pressed");
        this.isPressed = true;
    }
    release() {
        this.#element.classList.remove("pressed");
        this.isPressed = false;
    }

    play() {
        this.#sound.currentTime = 1;
        this.#sound.volume = 1;
        this.#sound.play();
        this.#timePlayed = performance.now();
    }
    unplay() {
        const elapsed = performance.now() - this.#timePlayed;
        if (elapsed < 100) {
            setTimeout(() => this.fadeOut(), 100 - elapsed);
        } else this.fadeOut();
    }

    fadeOut() {
        const fade = setInterval(() => {
            if (this.#sound.volume - 0.1 > 0) {
                this.#sound.volume -= 0.1;
            } else {
                this.#sound.volume = 0;
                this.#sound.pause();
                clearInterval(fade);
            }
        }, 10);
    }

    updateLetter(octave) {
        if (this.#octave === octave) {
            this.#letter = Object.keys(Mappings.letterToNote).find(key => Mappings.letterToNote[key] === this.#note);
        } else if (this.#octave === octave + 1 && ["C", "C#", "D", "Eb", "E", "F", "F#"].includes(this.#note)) {
            this.#letter = Object.keys(Mappings.letterToNote).find(key => Mappings.letterToNote[key] === this.#note + ".");
        }
        else this.#letter = "";
    }
};
