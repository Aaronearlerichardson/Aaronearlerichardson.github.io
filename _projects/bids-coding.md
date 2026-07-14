---
title: "BIDS_coding"
description: "A configurable BIDS-conversion toolkit for the lab's iEEG datasets, with PHI removal built in for NWB/DANDI compliance."
stack: [Python, BIDS, Nipype]
order: 10
repo: https://github.com/coganlab/BIDS_coding
---

Converting a lab's raw recordings into the BIDS standard is mostly the
same job every time — rename and reorganize files, strip identifying
information, validate the result — but the specifics (which fields count
as PHI, what the source layout looks like) differ dataset to dataset.
This toolkit handles that with a JSON-driven configuration layer instead
of a new one-off script per dataset: point it at a config describing the
source layout and what needs to change, and the same converter handles a
new dataset without new code.

## What it does

- Converts intracranial EEG datasets (with multi-echo MRI support) into
  the current BIDS specification for intracranial electroencephalography.
- Removes PHI as part of the conversion — not a separate pass — so
  there's no window where an intermediate file is BIDS-formatted but
  still identifiable, which matters for NWB/DANDI compliance downstream.
- Runs per-file or iterates a whole dataset from the command line, with a
  shell-script wrapper for repeated/batch runs across subjects.
- Builds on the same conversion approach as
  [Data2Bids](https://github.com/SIMEXP/Data2Bids), extended for the
  lab's intracranial-specific needs rather than the general fMRI case
  that project targets.
