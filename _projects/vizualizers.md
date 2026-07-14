---
title: "Vizualizers"
summary: "Two small from-scratch tools for building probability and signal-processing intuition by hand — exact dice-pool distributions, and a live time-domain/frequency-domain wave explorer."
stack: [Python, Tkinter, NumPy]
order: 4
demo: [dice, wave]
---

Two small desktop tools that build intuition for ideas I use professionally
in neural signal processing — probability distributions and the Fourier
transform — by making you construct them by hand instead of calling a
library function and trusting the output.

## Dice probability roller

Most dice tools estimate a distribution by rolling thousands of times. This
one doesn't simulate anything — it computes the exact probability mass
function of a sum of dice by discrete convolution. A single die is a uniform
distribution over its sides; the distribution of a sum of independent dice
is the convolution of their individual distributions, implemented from
scratch as a plain nested-loop convolution and combined across dice with
`functools.reduce`. Rolling *different* dice types together (say, `2d10 +
6d6`) works the same way one level up: `multi_roll` convolves each die
type's own distribution into a running combined distribution.

```python
def roll(num_sides: int, num_dice: int = 1) -> tuple[list[int], list[float]]:
    outcomes = list(range(num_dice, num_dice * num_sides + 1))
    set_frequencies = [[1] * num_sides for _ in range(num_dice)]
    comb_frequencies = reduce(convolve, set_frequencies)
    ...
```

No sampling noise, no confidence interval on the estimate itself — the
distribution it draws *is* the answer. A Tkinter GUI lets you add or remove
dice entries (sides and count) on the fly; the result is drawn directly on
a `Canvas` — no charting library — as a bar chart with the mean marked by a
vertical line and a 90% confidence interval overlaid as a dashed
double-headed arrow, all positioned and drawn by hand from the computed
outcome/probability pairs.

### Try it

This is a from-scratch JavaScript port of the same `roll`/`multi_roll`/
`convolve` functions and the same canvas drawing — not the Tkinter app
itself (that can't run in a browser), but the identical math, rebuilt for
the web.

<div class="demo-shell">
  <span class="demo-shell__label">Live demo — dice probability roller</span>
  <div class="dice-demo" data-demo="dice">
    <div class="dice-demo__rows">
      <div class="dice-row">
        <label>Sides<input type="number" class="dice-row__sides" min="2" max="100" value="6" aria-label="Number of sides, die 1"></label>
        <label>Count<input type="number" class="dice-row__count" min="1" max="20" value="2" aria-label="Number of dice, die 1"></label>
      </div>
    </div>
    <div class="dice-demo__controls">
      <button type="button" class="button button--ghost dice-demo__add">+ Add die</button>
      <button type="button" class="button button--ghost dice-demo__remove">&minus; Remove die</button>
      <button type="button" class="button dice-demo__roll">Roll</button>
    </div>
    <p class="dice-demo__warning" hidden></p>
    <canvas class="dice-demo__canvas" width="640" height="280" role="img" aria-label="Bar chart of the combined dice pool's outcome probabilities, with the mean and 90% confidence interval overlaid"></canvas>
    <p class="dice-demo__stats" aria-live="polite"></p>
  </div>
</div>

## Wave & Fourier transform visualizer

A companion tool for the other half of that intuition: what a signal looks
like in the time domain versus the frequency domain. Sliders control the
amplitude, frequency, and phase of a sine wave; **Edit Waveform** replaces
the current wave, **Add Waveform** sums a new component into it, so you can
build up a composite signal from individual sinusoids and watch its shape
change in real time.

The canvas draws two traces side by side: the waveform itself, and its
Fourier transform via `numpy.fft`, shifted with `fftshift` so zero frequency
sits at the center. The naive transform clips out to NaN at the edges of
the visible window, so it's clipped and re-interpolated (`np.interp`) back
onto the full display range before drawing — a small practical fix for a
naive FFT rather than a real spectral-estimation method, but enough to make
time-domain ↔ frequency-domain intuition visible and interactive, which is
the same intuition behind band-power and spectral-decomposition work on
real EEG/iEEG recordings.

### Try it

A JS port of the same `make_wave` / `forward` logic — set a sinusoid's
amplitude, frequency, and phase, then **Edit** to replace the waveform or
**Add** to superimpose it. The left panel is the time-domain signal; the
right is the real part of its Fourier transform (`fftshift`ed so zero
frequency is centered), recomputed live with a hand-written radix-2 FFT.
Add a few components to watch a composite signal's spectrum build up.

<div class="demo-shell">
  <span class="demo-shell__label">Live demo — wave &amp; Fourier transform</span>
  <div class="wave-demo" data-demo="wave">
    <canvas class="wave-demo__canvas" width="720" height="300" role="img" aria-label="Two side-by-side plots: on the left the time-domain waveform, on the right the real part of its fftshifted Fourier transform."></canvas>
    <p class="wave-demo__labels"><span>Time domain</span><span>Frequency domain (FFT)</span></p>
    <div class="wave-demo__controls">
      <label class="wave-demo__slider">Amplitude
        <input type="range" class="wave-demo__amp" min="0.01" max="1" step="0.01" value="0.5">
        <output class="wave-demo__amp-val">0.50</output>
      </label>
      <label class="wave-demo__slider">Frequency
        <input type="range" class="wave-demo__freq" min="0.1" max="10" step="0.1" value="1">
        <output class="wave-demo__freq-val">1.0</output>
      </label>
      <label class="wave-demo__slider">Phase
        <input type="range" class="wave-demo__phase" min="-3.14" max="3.14" step="0.01" value="0">
        <output class="wave-demo__phase-val">0.00</output>
      </label>
    </div>
    <div class="wave-demo__buttons">
      <button type="button" class="button wave-demo__edit">Edit waveform</button>
      <button type="button" class="button button--ghost wave-demo__add">Add waveform</button>
      <button type="button" class="button button--ghost wave-demo__reset">Reset</button>
    </div>
    <p class="wave-demo__status" role="status" aria-live="polite"></p>
  </div>
</div>

<p class="private-note">
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor"><path d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3Zm0 1.5A1.5 1.5 0 0 1 9.5 4v2h-3V4A1.5 1.5 0 0 1 8 2.5Z"/></svg>
  Both live in a private repo, so there's no source link above — these descriptions come from reading the actual code.
</p>
