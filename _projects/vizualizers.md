---
title: "Vizualizers"
summary: "Two small from-scratch tools for building probability and signal-processing intuition by hand — exact dice-pool distributions, and a live time-domain/frequency-domain wave explorer."
stack: [Python, Tkinter, NumPy]
order: 3
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

<p class="private-note">
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor"><path d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3Zm0 1.5A1.5 1.5 0 0 1 9.5 4v2h-3V4A1.5 1.5 0 0 1 8 2.5Z"/></svg>
  Both live in a private repo, so there's no source link above — these descriptions come from reading the actual code.
</p>
