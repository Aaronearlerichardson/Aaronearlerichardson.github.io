---
title: "IEEG_Pipelines"
summary: "Author and lead maintainer of the Cogan Lab's open-source iEEG/ECoG analysis toolkit — a PyPI package with CUDA kernels, Cython hot paths, and a parallel MATLAB API on its own CI."
stack: [Python, MATLAB, Cython, CUDA]
order: 1
repo: https://github.com/coganlab/IEEG_Pipelines
---

The lab's entire intracranial-EEG analysis stack, built and maintained from
the ground up: BIDS-native loading, signal processing, statistics, decoding,
and visualization, distributed as `pip install ieeg` with a parallel
MATLAB API kept alive on its own independent CI for the parts of the lab
that hadn't migrated yet.

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

Cross-platform CI (Windows/macOS/Linux) across Python 3.10–3.13, with a
separate MATLAB CI on the latest release; Codecov coverage tracking;
`pytest` with parametrized fixtures and doctest-modules; `pycodestyle` +
`black`; trusted publishing to PyPI via GitHub Actions; ReadTheDocs-built
documentation (the docs theme this site's palette is modeled on); MIT
licensed and citable via `citation.cff`. Also trained lab members on the
package and onboarded a co-maintainer, so it didn't depend on one person
to keep running.
