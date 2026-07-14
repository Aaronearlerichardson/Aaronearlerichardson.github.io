---
title: "IEEG_Pipelines"
description: "Author and lead maintainer of the Cogan Lab's open-source iEEG/ECoG analysis toolkit — a PyPI package with CUDA kernels, Cython hot paths, and a parallel MATLAB API on its own CI."
stack: [Python, MATLAB, Cython, CUDA]
order: 2
repo: https://github.com/coganlab/IEEG_Pipelines
thumbnail: /assets/images/thumb-ieeg-pipelines.jpg
thumbnail_webp: /assets/images/thumb-ieeg-pipelines.webp
thumbnail_alt: "3D render of a human brain with colored depth-electrode contacts and red surface electrodes, from the package's electrode-localization plotting."
---

The lab's entire intracranial-EEG analysis stack, built and maintained from
the ground up: BIDS-native loading, signal processing, statistics, decoding,
and visualization, distributed on PyPI as
[`pip install ieeg`](https://pypi.org/project/ieeg/) with a parallel
MATLAB API kept alive on its own independent CI for the parts of the lab
that hadn't migrated yet. Full documentation lives at
[ieeg-pipelines.readthedocs.io](https://ieeg-pipelines.readthedocs.io/en/latest/).

<figure class="figure figure--light">
  <picture>
    <source srcset="{{ '/assets/images/ieeg-brain.webp' | relative_url }}" type="image/webp">
    <img src="{{ '/assets/images/ieeg-brain.png' | relative_url }}" width="969" height="735" loading="lazy" alt="Semi-transparent 3D render of a human brain with depth-electrode contacts shown as colored bead strings threading into the tissue and red surface-electrode spheres across the cortex.">
  </picture>
  <figcaption>3D electrode localization rendered with <code>ieeg.viz</code> — depth-electrode contacts (colored strings) and surface electrodes (red) plotted on a reconstructed cortical surface via the package's MNE-integrated plotting.</figcaption>
</figure>

## What's in the package

- **`ieeg.io`** — BIDS-native loading via `pybids`, anonymized derivative
  saving.
- **`ieeg.timefreq`** — Hilbert transform, wavelet/superlet scaleograms,
  and high-gamma extraction, with the hot paths compiled: a hand-written
  Hilbert kernel in C and a CUDA kernel for the superlet transform, so the
  expensive time-frequency decompositions aren't pure-Python.
- **`ieeg.calc`** — permutation cluster statistics with pluggable test
  functions; mean-difference and t-test variants implemented in
  compiled C for speed.
- **`ieeg.navigate`** — epoching, outlier rejection, trial selection.
- **`ieeg.decoding`** — an sklearn-compatible `Decoder` with
  cross-validation, label shuffling, oversampling, joblib parallelism,
  and rolling-window decoding.
- **`ieeg.viz`** — MNE-integrated 3D electrode plotting, spectrograms,
  and decoder performance visualization.

## The migration this replaced

The lab ran on MATLAB/Windows before this existed. Rather than a flag-day
cutover, the package grew a parallel MATLAB API with its own CI so
existing MATLAB-based analyses kept working while new work moved to
Python/Linux — migrating the lab's tooling without stopping the lab's
research in the process.

## Built for the actual data volume

A standard iEEG array is 100–200 channels; the lab's µECoG arrays run
1000+. That difference drove real engineering choices: memory-mapped
arrays and sparse representations instead of loading everything into RAM,
explicit precision/storage trade-offs, and a swappable array-API backend
so the same code runs on CPU or GPU without a rewrite.

## Engineering practices

Every push and pull request runs the real test suite before it merges:
`pytest` across Windows/macOS/Ubuntu on Python 3.10–3.13 (parametrized
fixtures, doctest-modules, `pycodestyle`), plus a separate MATLAB suite
with JUnit test results and Cobertura coverage for the parts of the lab
that hadn't migrated yet — all tracked in Codecov, formatted with `black`.
It ships through code review on pull requests, not direct pushes to main:
90+ merged PRs, with the co-maintainer I trained and other contributors'
changes reviewed the same way mine are. 1,243 of the repo's 1,423 commits
(across all branches, version-controlled in Git) are mine. Nine tagged
PyPI releases since April 2024
(latest: 0.7.0) ship automatically off that same CI via GitHub's
trusted-publishing flow — a version tag is the whole release process, no
manual upload. ReadTheDocs-built documentation (the docs theme this
site's palette is modeled on); MIT licensed and citable via `citation.cff`.
