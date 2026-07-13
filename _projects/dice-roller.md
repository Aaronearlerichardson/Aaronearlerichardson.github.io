---
title: "Dice Probability Roller"
summary: "A desktop tool that computes the exact outcome distribution of a dice pool by convolution, instead of simulating rolls."
stack: [Python, Tkinter]
order: 3
---

## Exact, not simulated

Most dice tools estimate a distribution by rolling thousands of times.
This one doesn't simulate anything — it computes the exact probability
mass function of a sum of dice by discrete convolution. A single die is a
uniform distribution over its sides; the distribution of a sum of
independent dice is the convolution of their individual distributions,
implemented from scratch as a plain nested-loop convolution and combined
across dice with `functools.reduce`. Rolling *different* dice types
together (say, `2d10 + 6d6`) works the same way one level up:
`multi_roll` convolves each die type's own distribution into a running
combined distribution.

```python
def roll(num_sides: int, num_dice: int = 1) -> tuple[list[int], list[float]]:
    outcomes = list(range(num_dice, num_dice * num_sides + 1))
    set_frequencies = [[1] * num_sides for _ in range(num_dice)]
    comb_frequencies = reduce(convolve, set_frequencies)
    ...
```

No sampling noise, no confidence interval on the estimate itself — the
distribution it draws *is* the answer.

## The interface

A Tkinter GUI lets you add or remove dice entries (sides and count) on
the fly and hit **Roll** to compute the combined distribution across all
of them. The result is drawn directly on a `Canvas` — no charting
library — as a bar chart with the mean marked by a vertical line and a
90% confidence interval overlaid as a dashed double-headed arrow, all
positioned and drawn by hand from the computed outcome/probability pairs.

<p class="private-note">
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor"><path d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3Zm0 1.5A1.5 1.5 0 0 1 9.5 4v2h-3V4A1.5 1.5 0 0 1 8 2.5Z"/></svg>
  This one's source lives in a private repo, so there's no source link above — the description here comes from reading the actual code.
</p>
