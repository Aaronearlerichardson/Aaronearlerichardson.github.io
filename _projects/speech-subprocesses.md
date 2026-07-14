---
title: "Neural Sub-Processes of Speech"
description: "First-author iEEG study resolving the parallel neural sub-processes that link hearing a word to saying it — using a GPU-accelerated PyTorch tensor decomposition (sliceTCA) over intracranial recordings from 31 patients."
stack: [PyTorch, CUDA, iEEG, sliceTCA]
order: 1
repo: https://github.com/coganlab/SentenceRep_analysis
flagship: true
---

<aside class="manuscript-note">
  <strong>Manuscript in preparation.</strong> Earle-Richardson, A. M.,
  Duraivel, K., Southwell, D., Sinha, S., Vestal, M., Grant, G., Zafar, M.,
  &amp; Cogan, G. B. <em>Neural sub-processes linking speech perception and
  production.</em> First author. Presented as posters at the Society for
  Neuroscience (2022–2024), Duke TBS (2022–2023), and AAAS (2025); the
  written manuscript is in progress and has not been peer-reviewed.
  Descriptions below are kept at the level already shown publicly at those
  meetings.
</aside>

This is the largest thing I've built, and the source of most of my PyTorch
and signal-processing experience: the analysis behind a first-author paper
on how the brain turns a heard word into a spoken one.

<figure class="figure">
  <svg class="tensor-schematic" viewBox="0 0 620 216" role="img" aria-labelledby="tca-title tca-desc" xmlns="http://www.w3.org/2000/svg">
    <title id="tca-title">sliceTCA tensor decomposition schematic</title>
    <desc id="tca-desc">A three-dimensional data tensor of frequency by time by electrode is approximated as a sum of rank-one slice components, each a channel-weight vector multiplied by a shared time-frequency pattern.</desc>
    <polygon class="ts-box-top" points="40,68 64,48 148,48 124,68"/>
    <polygon class="ts-box-side" points="124,68 148,48 148,148 124,168"/>
    <rect class="ts-box-front" x="40" y="68" width="84" height="100"/>
    <text class="ts-label" x="82" y="190" text-anchor="middle">data tensor</text>
    <text class="ts-sub" x="82" y="204" text-anchor="middle">freq × time × electrode</text>
    <text class="ts-op" x="176" y="126" text-anchor="middle">&#8776;</text>
    <g transform="translate(200,0)">
      <rect class="ts-weight" x="0" y="76" width="16" height="84"/>
      <text class="ts-op ts-op--sm" x="30" y="124" text-anchor="middle">×</text>
      <rect class="ts-slice" x="44" y="76" width="66" height="84" rx="4"/>
      <rect class="ts-band ts-band--a" x="50" y="86" width="54" height="12"/>
      <rect class="ts-band ts-band--b" x="50" y="104" width="54" height="12"/>
      <rect class="ts-band ts-band--c" x="50" y="122" width="54" height="12"/>
      <rect class="ts-band ts-band--b" x="50" y="140" width="54" height="12"/>
    </g>
    <text class="ts-op" x="330" y="126" text-anchor="middle">+</text>
    <g transform="translate(356,0)">
      <rect class="ts-weight" x="0" y="76" width="16" height="84"/>
      <text class="ts-op ts-op--sm" x="30" y="124" text-anchor="middle">×</text>
      <rect class="ts-slice" x="44" y="76" width="66" height="84" rx="4"/>
      <rect class="ts-band ts-band--b" x="50" y="86" width="54" height="12"/>
      <rect class="ts-band ts-band--c" x="50" y="104" width="54" height="12"/>
      <rect class="ts-band ts-band--a" x="50" y="122" width="54" height="12"/>
      <rect class="ts-band ts-band--c" x="50" y="140" width="54" height="12"/>
    </g>
    <text class="ts-op" x="490" y="126" text-anchor="middle">+</text>
    <text class="ts-op" x="524" y="122" text-anchor="middle">&#8943;</text>
    <text class="ts-label" x="350" y="190" text-anchor="middle">rank-1 slice components</text>
    <text class="ts-sub" x="350" y="204" text-anchor="middle">weights × time-frequency pattern</text>
  </svg>
  <figcaption>How sliceTCA factorizes the data: the frequency × time × electrode tensor is approximated as a sum of rank-one components, each a set of electrode weights times a shared time-frequency pattern — fit by gradient descent. (My own schematic of the general method; no figures from the manuscript appear on this site.)</figcaption>
</figure>

## The question

Repeating a word you just heard is a basic bridge between perception and
production, but the textbook picture is a single serial pathway: sound in
one region, relayed to another for articulation. Behavioral dissociations
in aphasia and the spatially scattered, mixed responses seen in
intracranial recordings suggest something more parallel. The paper tests
whether speech repetition is instead supported by **multiple parallel
neural sub-processes** that run at once — and, because nobody knows in
advance which electrodes belong to which sub-process, it needs a method
that finds that structure from the data rather than assuming it.

## The task and the data

31 patients undergoing intracranial monitoring performed a delayed
repetition task with three conditions — listen-and-speak, listen-and-mime,
and just-listen — designed to pull perception, a memory delay, and
production apart in time. From roughly 1,600 electrodes, sites were first
grouped into Auditory, Production, and Sensory-Motor classes by their
high-gamma (50–300 Hz) response profiles. The Sensory-Motor group was the
messy one: anatomically spread out and spectrotemporally heterogeneous —
exactly the signature you'd expect if several distinct processes were
overlapping inside it.

## The method: tensor decomposition, not clustering

To pull those overlapping processes apart without assuming which channels
group together, I used **sliceTCA** (slice tensor component analysis) — an
unsupervised decomposition that extends non-negative matrix factorization
into the tensor domain. Where a matrix method flattens the data and can
only capture one kind of covariance, sliceTCA keeps the
frequency × time × electrode tensor intact and fits a small sum of rank-one
"slice" components — each a set of electrode weights times a shared
time-frequency pattern — **by gradient descent**, minimizing reconstruction
error. Cross-validation on held-out data picked four components.

Those four components resolved four latent sub-networks inside
Sensory-Motor cortex — a Visual network locked to the cue, a Feedback
network over auditory cortex, a Motor-transformation network over
premotor/parietal cortex, and a **Working-Memory network** with sustained,
strongly left-lateralized activity through the delay. Time-resolved
decoders (PCA-LDA) then read word identity and task condition out of each
network over the trial. The headline result: only the Working-Memory
sub-network held onto *which word* through the delay and predicted the
patient's reaction time — marking it as the most plausible substrate for
holding a word "in mind" before speaking it. The upshot is a reframing of
the speech sensory-motor interface as parallel, specialized sub-processes
rather than one serial relay.

## The engineering

The science rests on three codebases I wrote or extended:

- **[slicetca](https://github.com/Aaronearlerichardson/slicetca)** — my
  fork of Arthur Pellegrino's PyTorch/Lightning sliceTCA library, and where
  most of my PyTorch work lives. To make it fit iEEG-scale data and
  converge on these tensors I added L2 and orthogonality regularization,
  learning-rate decay, and a dynamic-time-warping reconstruction loss, plus
  a round of memory-footprint and autograd fixes (a transpose that was
  silently killing gradients, among others). It runs on GPU via CUDA.
- **[IEEG_Pipelines](https://github.com/coganlab/IEEG_Pipelines)** — my
  open-source `ieeg` package (`pip install ieeg`), which did all the
  upstream signal processing: multitaper line-noise removal and high-gamma
  extraction (31 log-spaced bands, Hilbert envelope, baseline z-scoring).
  It's cited as the pipeline in the paper's methods. There's a
  [fuller writeup here]({{ '/projects/ieeg-pipelines/' | relative_url }}).
- **[SentenceRep_analysis](https://github.com/coganlab/SentenceRep_analysis)**
  — the analysis itself: functional grouping, the sliceTCA decomposition,
  the decoders, and the permutation statistics that tie it together.

The scale is what makes it real engineering rather than a notebook: dense
recordings across 31 patients, decompositions fit by gradient descent on
GPU, and enough cross-validation, permutation testing, and
random-seed replication to know the four components are signal and not an
artifact of one lucky fit.

## Where my PyTorch experience comes from

When my other work here mentions PyTorch, GPU-accelerated tensor methods,
or gradient-based optimization, this is the project underneath it — a real
model, fit to real data, at a scale that forced the memory and convergence
work rather than a tutorial.
