---
title: "matgrab"
description: "A small PyPI package that pulls named variables out of MATLAB .mat files — however deeply nested — straight into a pandas DataFrame."
stack: [Python, pandas, SciPy]
order: 8
repo: https://github.com/Aaronearlerichardson/matgrab
---

A utility born out of a recurring annoyance: MATLAB `.mat` files store
data as arbitrarily nested structs, and pulling one specific field out of
one buried in a `.mat` file usually means writing throwaway indexing code
every time. `matgrab` turns that into one call.

```python
import matgrab
df = matgrab.mat2df("EEG.mat", ["sub-D0048.anat.CT", "sub-D0048.ieeg.channels"])
```

Dotted paths address nested struct fields directly, so a variable buried
three structs deep is addressed the same way as a top-level one. The
core function recurses through `scipy.io.loadmat`'s parsed structure
(unwrapping MATLAB's own internal/readme keys along the way), resolves
each requested path segment by segment, and concatenates whatever it
finds into a single DataFrame — accepting a single file, a directory of
files, or a list of either, so a whole directory of subject `.mat` files
can be pulled into one call.

Packaged properly rather than left as a script: published on
[PyPI](https://pypi.org/project/matgrab/) (`pip install matgrab`), with a
real test suite, `setup.py`/`pyproject.toml`,
and the standard `CONTRIBUTING.md`/`CODE_OF_CONDUCT.md` pair — small in
scope, but shipped like a real library rather than a personal script.
