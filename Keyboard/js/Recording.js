class Recording{
    #name;
    #events = [];
    #start;

    constructor(name){
        this.#name = name;
        this.#start = performance.now();
    }

    getName() {return this.#name;}
    getEvents() {return this.#events;}
    getStart() {return this.#start;}

    addEvent(time, note, action){
        this.#events.push({time, note, action});
    }
}