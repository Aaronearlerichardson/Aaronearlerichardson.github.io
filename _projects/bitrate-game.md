---
title: "GridQuest"
summary: "A spatial-selection input game that measures achieved information transfer rate the way BCI decoders are benchmarked."
stack: [Python, Pygame, Nuitka]
order: 2
repo: https://github.com/Aaronearlerichardson/bitrate_game
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
own binary rather than being cross-built from one runner.
