class Recorder{
    static #instance = null;
    elementToRecording = new Map()
    isRecording = false;
    currentRecording = null;
    oneMinuteStopper = null;
    timerUpdate = null;
    pendingItem = null;
    playingTimes = [];
    MAX_RECORDINGS = 10
    onKeyDown;
    
    constructor(recordBtn, timer, recordingList, namingPopup, keyboard){
        if (Recorder.#instance) return Recorder.#instance;
        this.recordBtn = recordBtn;
        this.timer = timer;
        this.recordingList = recordingList;
        this.namingPopup = namingPopup;
        this.keyboard = keyboard;
        Recorder.#instance = this;
        this.createEvents();
        this.createOnKeyDown();
    }

    static getInstance(){return Recorder.#instance;}

    createEvents(){
        this.recordBtn.addEventListener("click", () => this.handleBtn());
        this.confirmPopup = document.getElementById("confirm-popup");
        this.confirmText = document.getElementById("confirm-text");
        document.getElementById("confirm-name-btn").addEventListener("click", () => {
            this.submitName();
        })

        document.getElementById("confirm-delete-btn").addEventListener("click", () => {
            this.pendingItem.remove();
            this.elementToRecording.delete(this.pendingItem);
            if (this.elementToRecording.size < this.MAX_RECORDINGS){
                this.timer.querySelector("#recording-overflow").textContent = "";
            }
            this.keyboard.inputEnabled = true;
            this.confirmPopup.classList.add("hidden");
        });

        document.querySelectorAll(".popup-cancel-btn").forEach(btn =>
            btn.addEventListener("click", () => {
                btn.closest(".popup-box").classList.add("hidden");
                this.keyboard.inputEnabled = true;
                this.namingPopup.querySelector("#naming-error").textContent = "";
            })
        );

    }

    createOnKeyDown(){
        this.onKeyDown = (e) => {
            if (e.key === "Enter"){
                this.submitName();
            }
        };
    }

    handleBtn(){
        if (this.isRecording){
            this.stopRecording();
            return;
        }
        this.quitPlaying();
        if (this.elementToRecording.size >= this.MAX_RECORDINGS){
            this.timer.querySelector("#recording-overflow").textContent = "Delete one first.";
            return;
        }
        this.Popup();
    }

    Popup(){
        this.namingPopup.classList.remove("hidden");
        this.keyboard.inputEnabled = false;
        const input = this.namingPopup.querySelector("input");
        input.value = this.generateDefaultName();
        input.focus();
        input.select();

        this.namingPopup.addEventListener("keydown", this.onKeyDown);
    }

    submitName(){
        const name = this.namingPopup.querySelector("input").value.trim();
        if (!name){
            this.namingPopup.querySelector("#naming-error").textContent = "Name can't be empty.";
            return;
        }
        if (this.nameExists(name)){
            this.namingPopup.querySelector("#naming-error").textContent = "Name already taken.";
            return;
        }
        this.namingPopup.querySelector("#naming-error").textContent = "";
        this.namingPopup.classList.add("hidden");
        this.namingPopup.removeEventListener("keydown", this.onKeyDown);
        this.startRecording(name);
    }

    startRecording(name){
        this.currentRecording = new Recording(name);
        this.isRecording = true;
        this.keyboard.inputEnabled = true;
        this.recordBtn.textContent = "Stop";
        this.recordBtn.classList.add("recording");

        this.updateTimer();
        this.timerUpdate = setInterval(() => this.updateTimer(), 1000);
        this.oneMinuteStopper = setTimeout(() => this.stopRecording(), 60000);
    }

    stopRecording(){
        this.keyboard.releaseKeyboard();
        clearTimeout(this.oneMinuteStopper);
        clearTimeout(this.timerUpdate);
        this.oneMinuteStopper = null;
        this.timerUpdate = null;

        this.isRecording = false;
        this.recordBtn.textContent = "Record";
        this.recordBtn.classList.remove("recording");
        this.timer.querySelector("#timer-text").textContent = "";


        this.createRecordingItem(this.currentRecording);
        this.currentRecording = null;
    }

    updateTimer(){
        const time = Math.floor((performance.now() - this.currentRecording.getStart()) / 1000)
        const seconds = String(time).padStart(2, "0");
        this.timer.querySelector("#timer-text").textContent = "0:" + seconds;
    }

    generateDefaultName(){
        const usedNumbers = new Set();
        for (const recording of this.elementToRecording.values()){
            const name = recording.getName();
            if (name.startsWith("Recording ")){
                const ending = name.slice(10);
                const num = Number(ending);
                if (Number.isInteger(num) && num > 0 && String(num) === ending){
                    usedNumbers.add(num)
                }
            }
        }
        let n = 1;
        while (usedNumbers.has(n)) n++;
        return "Recording " + n;
    }

    nameExists(name){
        for (const recording of this.elementToRecording.values()){
            if (recording.getName() === name) return true;
        }
        return false;
    }

    noteEvent(note, action){
        if (!this.isRecording) return;
        const time = performance.now() - this.currentRecording.getStart();
        this.currentRecording.addEvent(time, note, action);
    }

    createRecordingItem(recording){
        const item = document.createElement("div");
        item.classList.add("recording-item");
        const nameElement = document.createElement("span");
        nameElement.classList.add("recording-name");
        nameElement.textContent = recording.getName();

        const buttons = document.createElement("div");
        buttons.classList.add("recording-btns");

        const playBtn = document.createElement("button");
        playBtn.classList.add("play-btn");
        playBtn.textContent = "Play";
        playBtn.addEventListener("click", () => this.playRecording(recording));

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => this.confirmDelete(item, recording));

        buttons.append(playBtn, deleteBtn);
        item.append(nameElement, buttons);
        
        this.elementToRecording.set(item, recording);
        this.recordingList.appendChild(item);
    }

    playRecording(recording){
        if (this.isRecording) return;
        this.quitPlaying();
        this.keyboard.inputEnabled = false;
        let lastTime;
        for (const {time, note, action} of recording.getEvents()){
            this.playingTimes.push(setTimeout(() => this.setTime(note, action), time));
            lastTime = time
        }
        this.playingTimes.push(setTimeout(() => this.keyboard.inputEnabled = true, lastTime + 75))
    }

    setTime(note, action){
        const key = this.keyboard.noteToKey[note];
        if (!key) return;
        if (action === NoteAction.DOWN) this.keyboard.pressKey(key);
        else this.keyboard.releaseKey(key);
    }

    confirmDelete(item, recording){
        if (this.isRecording) return;
        this.quitPlaying();
        this.keyboard.inputEnabled = false;
        this.pendingItem = item;
        const name = recording.getName();
        this.confirmText.textContent = "Delete " + name + "?";
        this.confirmPopup.classList.remove("hidden");
    }

    quitPlaying(){
        this.keyboard.releaseKeyboard();
        for (const timeOut of this.playingTimes){
            clearTimeout(timeOut);
        }
        this.playingTimes = [];
        this.keyboard.inputEnabled = true;
    }
}