---
title: "CMRIF Preprocess"
summary: "A BIDS-aware fMRI preprocessing pipeline that lets you mix and match tools across FSL, AFNI, FreeSurfer, and ME-ICA instead of committing to one package's whole stack."
stack: [Python, Nipype, BIDS, AWS]
order: 5
repo: https://github.com/Aaronearlerichardson/CMRIF_preprocess
---

Built for Cornell's Cornell Magnetic Resonance Imaging Facility, this is
the infrastructure side of fMRI preprocessing: getting raw scanner output
into a standard, query-able layout, then running a pipeline over it
without being locked into a single neuroimaging package's opinions.

## Why modular

Most fMRI preprocessing pipelines pick one toolkit and use it end to end.
This one leans on Nipype specifically so a step can be swapped independently
— brain extraction from FSL's `BET`, anatomical-to-EPI alignment from
AFNI, motion correction from FreeSurfer, multi-echo denoising from
`tedana` — without having to also adopt that package's conventions for
every other step. `pybids` handles dataset querying, so a run is scoped
with plain include/exclude flags (`-ex s12r3e2` to skip subject 12, run 3,
echo 2) instead of hand-written glob patterns over a directory tree.

## Three pieces

<figure class="figure-row">
  <figure class="figure">
    <img src="{{ '/assets/images/cmrif-create-image.png' | relative_url }}" width="1513" height="700" alt="AWS EC2 'Create Image' dialog capturing the preprocessing environment — root plus a 100 GiB data volume — into a reusable machine image.">
  </figure>
  <figure class="figure">
    <img src="{{ '/assets/images/cmrif-ami.png' | relative_url }}" width="1085" height="640" alt="AWS console showing the resulting custom 'Base_Image' AMI, ready to launch on demand.">
  </figure>
  <figcaption>The MRI-optimized environment baked into a reusable AWS machine image (left) so any instance can spin it up ready-to-run (right) — the "disk image" piece of the pipeline.</figcaption>
</figure>

- **A preconfigured disk image** (Anaconda + AFNI + FreeSurfer + FSL +
  `dcm2niix`/`pigz`) so a lab machine or an AWS instance can run the
  pipeline without a from-scratch environment setup.
- **A DICOM/NIFTI → BIDS converter**, so raw scanner output becomes a
  standard, `pybids`-queryable layout before anything else runs.
- **The modular preprocessing script** itself, driven by a CLI
  (`CMRIF_preprocess.py -i <BIDS dir> -ex <exclusions> -verb`) that wires
  the chosen tools together over whatever subset of the dataset you scope
  it to.

## Where it's used

This is the same infrastructure referenced in my Cornell lab-technician
work: an AWS-deployed version of this pipeline processed the psychology
department's functional MRI data during that role.
