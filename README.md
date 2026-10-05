# Piano Player

A browser-based piano built in vanilla JavaScript — no frameworks, no audio libraries. It renders a full 88-key keyboard, plays real `.wav` samples per note, supports both mouse and computer-keyboard input simultaneously, and includes a recorder that captures a performance as a timed event list and can replay it.

A smaller single-key demo (`C4key/`) exists alongside it as the original proof-of-concept for the press/hold/release/fade-out sound logic before it was generalized into the full keyboard's class structure.

## Live demo
Open `Keyboard/fullkeyboard.html` in a browser for the full instrument, or `C4key/C4key.html` for the minimal single-key version.

## Project structure

```
Piano-Player/
├── C4key/              # Single-key proof of concept (no classes, procedural)
│   ├── C4key.html
│   ├── C4key.css
│   ├── C4key.js
│   └── C4.wav
├── Keyboard/            # Full 88-key instrument
│   ├── fullkeyboard.html
│   ├── css/
│   │   ├── Base.css
│   │   ├── keyboard.css
│   │   ├── Recorder.css
│   │   └── Popups.css
│   ├── js/
│   │   ├── Enums.js       # Frozen constant objects (Color, NoteAction)
│   │   ├── Mappings.js    # Computer-key → note letter map
│   │   ├── Key.js         # One piano key: state, sound, DOM element
│   │   ├── Keyboard.js    # Owns all keys, routes input, tracks octave
│   │   ├── Recording.js   # Plain data object: a named list of timed events
│   │   ├── Recorder.js    # Recording/playback UI and orchestration
│   │   └── main.js        # Wires everything together on page load
│   └── misc/
│       └── instructions.txt
└── sounds/              # One .wav sample per note, A0–C8
```

## Architecture

The full keyboard is built around three classes that split cleanly by responsibility:

**`Key`** — represents a single piano key. Owns its own `<audio>` element, its DOM element, and its own play/fade-out logic. A `Key` knows how to play and release *itself*; it does not know about any other key, and it does not listen for keyboard-letter input directly — only mouse events on its own element (`mouseenter`/`mouseleave`, used for hover-drag playing across keys, plus press/release triggered externally by `Keyboard`).

**`Keyboard`** — a singleton (`Keyboard.getInstance()`) that owns every `Key`, builds the visual layout, and is the single place all input (mouse and computer keyboard) gets routed through. It maintains the current octave, translates a pressed letter into the correct note via `Mappings`, and keeps two lookup structures:
- `noteToKey` (plain object, note-id → `Key`) — used when input names a note directly (keyboard letters, recorder playback).
- `elementToKey` (`Map`, DOM element → `Key`) — used when input comes from a DOM event (mouse clicks/hover), since DOM elements aren't usable as plain-object keys.

**`Recorder`** — also a singleton, decoupled from `Keyboard` except through a narrow interface: `Keyboard.pressKey`/`releaseKey` call `Recorder.getInstance()?.noteEvent(...)` after the fact, so the keyboard has zero knowledge of whether a recording is in progress. `Recorder` owns all the recording UI (naming popup, delete-confirmation popup, the recordings list) and turns a live performance into a `Recording` — a plain data object holding a name and a flat list of `{time, note, action}` events, timestamped relative to when recording started.

Playback works by replaying that same event list with `setTimeout`, calling the same `pressKey`/`releaseKey` path a live keypress would — so recorded playback and live play are visually and audibly identical, and a recording is really just "a script of inputs," not a separate rendering path.

### Why a singleton for `Keyboard` and `Recorder`
There is exactly one keyboard and one recorder on the page. The singleton pattern lets any `Key` instance reach its owning `Keyboard` (`Keyboard.getInstance()`) without every `Key` needing a constructor-injected reference, and lets `Keyboard` reach the active `Recorder` the same way — without either class needing to know about the other's construction order beyond "does this instance exist yet."

### Note naming and octave mapping
Notes are named `<pitch><octave>` (e.g. `"C#4"`), matching the `.wav` filenames in `sounds/`. A fixed `NOTES` array (`["C", "C#", "D", "Eb", ...]`) defines pitch order within an octave, used both for building the keyboard left-to-right and for sorting the currently-held notes in the live display (`updateDisplay`).

The computer-keyboard mapping (`Mappings.letterToNote`) covers roughly one and a half octaves at a time — the lower row of letters (`a`–`j`) maps to the current octave, and a second row (`k` onward, using the `.` suffix convention, e.g. `"C."`) maps to current-octave+1's first 7 (white) notes. `Key.updateLetter(octave)` recomputes which letter (if any) is bound to that key whenever the octave shifts via `X`/`Z`.

## Bugs that were found and fixed

These three issues existed earlier in development and are worth being able to explain — both the original mechanism and the fix — since they all trace back to one root cause: **key identity/letter binding was being treated as always-current, when it actually needs to be resolved once (at press time) and then held fixed for the lifetime of that press.**

1. **Mouse-then-keyboard retrigger asymmetry — fixed.** Originally, clicking a key with the mouse and then pressing its mapped letter would retrigger the note, but doing it in the other order wouldn't. The fix: both the mouse (`container` `mousedown`) and keyboard (`window` `keydown`) handlers now funnel through the exact same call — `Keyboard.pressKey(key)` → `Key.pressKey()` — with no per-input-source branching. Retriggering is now driven purely by `Key#isPressed`, so both input orders behave identically.

2. **`Key.#letter` going stale across an octave shift — fixed.** The letter each key responds to is now recomputed for *every* key, immediately, on every octave change: `Keyboard`'s `X`/`Z` handlers call `this.elementToKey.forEach((key) => key.updateLetter(this.currOctave))` right after updating `currOctave`, so no key is left pointing at a letter binding from before the shift.

3. **`keyup` releasing the wrong key after an octave shift — fixed.** `Keyboard.lettersDown` stores the actual `Key` *object* a letter triggered, captured once at `keydown` time (`this.lettersDown.set(lcKey, currKey)`) — it is never recomputed from the letter using whatever the *current* octave happens to be. So if the octave changes while a key is held, `keyup` still resolves to, and releases, that same original `Key` object — not whatever note that physical letter maps to now. (Traced concretely: press `a` at octave 4 → shift up with `x` → release `a` → still correctly releases the original C4 key, even though `a` now maps to C5.)

## Data structures — quick rationale

| Structure | Type | Why |
|---|---|---|
| `noteToKey` | plain object | Keys are always simple strings (`"C#4"`); no need for `Map`'s extra guarantees, and object literal syntax is marginally more convenient here. |
| `elementToKey` | `Map` | Keys are DOM elements (objects), which a plain object can't use as keys reliably (they'd be coerced to `"[object HTMLDivElement]"`). `Map` supports arbitrary object keys natively. |
| `lettersDown` | `Map` | Same reasoning — needs to record *which* `Key` object a given letter is currently bound to, not just whether it's down, so `keyup` can release the correct key regardless of any octave shift in between. |
| `keysDown` | `Set` | Only needs presence/absence of a `Key`, used for the live display and for releasing everything on blur/visibility-change; no associated value needed. |
| `Recording.#events` | array of plain objects | Order matters (it's a timeline) and it's replayed sequentially — an array of `{time, note, action}` is the simplest structure that preserves both order and each event's own timestamp for `setTimeout`-based playback. |

## Tech stack
HTML, CSS, vanilla JavaScript (ES2022 private class fields, static class fields). No frameworks, no audio libraries — playback and fade-out are hand-rolled on top of the `HTMLAudioElement` API.

## Usage
Open `Keyboard/fullkeyboard.html` in any modern browser.
- Click keys or press the mapped letters to play notes (`a`–`j` for the base octave, `k` onward for the octave above).
- `Z` / `X` shift the current octave down/up.
- **Record** captures a performance (up to 60 seconds, up to 10 saved recordings), which can be named, replayed, or deleted.

---
Created by Tomer Kviatek
