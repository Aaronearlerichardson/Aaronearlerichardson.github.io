---
title: "GridQuest"
description: "A spatial-selection input game that measures achieved information transfer rate the way BCI decoders are benchmarked."
stack: [Python, Pygame, Nuitka]
order: 3
repo: https://github.com/Aaronearlerichardson/bitrate_game
demo: gridquest
---

## What it measures

GridQuest scores a human input method the same way a BCI decoder gets
scored: achieved bit rate, after Shenoy et al. 2021 —

```
B = log2(N - 1) * max(S_c - S_i, 0) / t
```

With **N = 81** possible targets (a 9×9 grid), a correct selection carries
`log2(80) ≈ 6.32` bits. The point isn't the game — it's using it as a
benchmark for how much information a real selection interface can move
per second, comparable against neural-decoding baselines.

## The selection mechanic

Each target is chosen with exactly two keypresses. A cue shows a mini 9×9
board with one cell highlighted; the player presses the key for the outer
3×3 group containing it, then the key for the inner position within that
group. `Q W E / A S D / Z X C` map spatially to both the outer grouping
and the inner position, so the same nine keys carry both stages of the
selection and the motor vocabulary stays tiny. Cues are drawn i.i.d.
uniform — no language model, no letter frequencies, no locale bias — so
the paradigm generalizes past any one alphabet.

### Try it

A from-scratch JS/DOM port of the same session state machine, selection
logic, and bit-rate formula — not the Pygame binary itself (that can't run
in a browser), but exactly the rules described above. Click the board or
**Start practice**, then use `Q W E / A S D / Z X C` on your keyboard (tile
clicks work too). **Start scored run** runs the real 60-second timed
benchmark, countdown included.

<div class="demo-shell">
  <span class="demo-shell__label">Live demo — GridQuest</span>
  <div class="gq-demo" data-demo="gridquest">
    <div class="gq-demo__hud">
      <div class="gq-demo__bitrate"></div>
      <div class="gq-demo__timer"></div>
    </div>
    <div class="gq-demo__board" role="group" aria-label="GridQuest selection board"></div>
    <p class="gq-demo__message"></p>
    <p class="visually-hidden gq-demo__status" role="status" aria-live="polite"></p>
    <div class="gq-demo__controls">
      <button type="button" class="button gq-demo__practice">Start practice</button>
      <button type="button" class="button button--ghost gq-demo__scored">Start scored run (60s)</button>
      <button type="button" class="button button--ghost gq-demo__menu">Back to menu</button>
    </div>
    <div class="gq-demo__results" hidden></div>
  </div>
</div>

## Architecture

```
src/bitrate_game/
  core.py       Session, BitRateTracker, TargetSource  (UI-free logic)
  mode.py       GridQuestMode + GameMode protocol
  adapters.py   PygameKeyboardAdapter + InputAdapter protocol
  renderer.py   PygameGridRenderer + Renderer protocol
  config.py     all tunables (grid size, keys, timing, colors)
  main.py       wires the components together
```

`core` and `mode` hold zero pygame imports. Input handling and rendering
sit behind `InputAdapter`/`Renderer` protocols, so swapping in a browser
front end or a different input device (e.g. an actual BCI decoder feeding
selections in) means writing a new adapter/renderer pair, not touching
the scoring or session logic.

## Shipping it

Standalone binaries are built per-OS with Nuitka through a GitHub Actions
build matrix — Nuitka doesn't cross-compile, so each target OS builds its
own binary rather than being cross-built from one runner. Prefer the real
thing over the in-browser port above? **[Download a native build](https://github.com/Aaronearlerichardson/bitrate_game/releases)**
for macOS, Windows, or Linux from the releases page.
