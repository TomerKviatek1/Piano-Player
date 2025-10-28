# Piano Player 28/10/2025

A collection of small web-based piano projects demonstrating sound synthesis, event handling, and object-oriented architecture in JavaScript.

## Structure
- **C4key/** – a single-key demo that plays middle C (C4) with fade-out. no class.
- **Keyboard/** – a full 88-key virtual piano built from modular `Key` and `Keyboard` classes.
- **sounds/** – shared .wav samples for realistic piano tones.

## Description
An assymetry in the code is to be regarded:
When clicking on a key with the mouse and then pressing its respective letter, the key retriggers.
Such behavior is not regarded in the other way, meaning no mouse retriggers when the key is pressed with the computer keyboard are implemented.
To be regarded in the future.

Certain bugs are to be fixed:
- When shifting octaves while pressing a key with the computer keyboard, "keyup" event hooks the wrong key for it is now an octave away.
Such mistake keeps the pressed note down even after leaving the computer key.

## Features
- Click or press mapped keys to play notes.
- Smooth fade-out sound release.
- Octave shifting (`Z` / `X` keys).
- Displays pressed notes in real time.
- RECORDING MODE TO BE ADDED SOON.

## Tech Stack
- HTML, CSS, JavaScript
- NO LIBRARIES USED.

## Usage
Open `C4key/index.html` or `Keyboard/fullkeyboard.html` in any modern browser.

---

Created by Tomer Kviatek
