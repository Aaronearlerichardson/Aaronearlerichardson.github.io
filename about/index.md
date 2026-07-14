---
layout: default
title: About
permalink: /about/
summary: "Bio, education, and skills for Aaron Earle-Richardson — neural signal processing and BCI engineering."
---

<h1>About</h1>

<img class="about-portrait" src="{{ '/assets/images/aaron-headshot.jpg' | relative_url }}" width="400" height="400" alt="Portrait of Aaron Earle-Richardson">

<p>
  I'm a neural signal processing and BCI engineer with a background
  building decoding pipelines and data infrastructure for intracranial
  neuroscience research aimed at speech brain-computer interfaces. Most
  recently, in the <a href="https://github.com/coganlab">Cogan Lab</a> at
  Duke University's Department of Neurology, I worked day-to-day with
  high-density &mu;ECoG arrays (up to 1024 channels) recorded
  intraoperatively at Duke University Medical Center, in collaboration
  with the Viventi Lab, under FDA Investigational Device Exemption and
  Duke IRB oversight.
</p>

<p>
  I built and maintained <a href="https://ieeg-pipelines.readthedocs.io/en/latest/">IEEG_Pipelines</a>,
  the lab's open-source iEEG/ECoG analysis stack (BIDS conversion, PHI
  removal for NWB/DANDI compliance, GPU-accelerated signal processing) —
  and, fittingly, this site's color palette and type are modeled directly
  on its documentation theme.
</p>

<p>
  I have a real passion for brain-computer interfaces, medical data
  analysis, and research more broadly — and I'm open to new
  opportunities in that space.
</p>

<h2>Experience</h2>
<ul class="timeline">
  <li>
    <time>Jan 2025 – Jun 2026</time>
    <strong>Scientific Data Manager I</strong> — Duke Department of Neurology (Cogan Lab).
    Led data infrastructure for research under FDA IDE and Duke IRB oversight;
    maintained BIDS-standard systems with PHI removal for NWB/DANDI compliance;
    authored and version-controlled analysis pipelines; led the lab's migration
    from MATLAB/Windows to a Python/Linux stack.
  </li>
  <li>
    <time>Apr 2021 – Dec 2024</time>
    <strong>Research Technician II</strong> — Duke Department of Neurology (Cogan Lab).
    Converted lab data systems to the BIDS standard; built new ECoG/iEEG
    analysis pipelines; supported intracranial recording research across
    Duke Neurology, Neurosurgery, and the Viventi Lab.
  </li>
  <li>
    <time>May 2019 – Dec 2019</time>
    <strong>Lab Technician</strong> — Cornell Psychology Department.
    Built an AWS-deployed fMRI preprocessing server (BIDS format),
    integrating FSL, AFNI, FreeSurfer, and ME-ICA via Python Nipype —
    see <a href="{{ '/projects/cmrif-preprocess/' | relative_url }}">CMRIF Preprocess</a>.
  </li>
  <li>
    <time>Jan 2017 – May 2019</time>
    <strong>Research Assistant</strong> — Cornell Psychology Department.
    Supported an fMRI study of Locus Coeruleus activity; identified a
    study-design flaw that led to a protocol change.
  </li>
</ul>

<h2>Education</h2>
<ul class="timeline">
  <li>
    <time>Jan 2021 – May 2022</time>
    <strong>Duke University, Pratt School of Engineering</strong> — Master of
    Engineering, Biomedical Engineering; Medical Device Design Certificate.
  </li>
  <li>
    <time>Sept 2016 – May 2019</time>
    <strong>Cornell University</strong> — B.S., Bioengineering.
  </li>
</ul>

<h2>Research &amp; publications</h2>
<p>
  First-author paper in preparation, <em>Neural sub-processes linking
  speech perception and production</em> — a PyTorch decoder applying
  unsupervised tensor decomposition (a fork of
  <a href="https://github.com/Aaronearlerichardson/slicetca">sliceTCA</a>)
  to iEEG recordings from patients undergoing pre-surgical intracranial
  monitoring at Duke, in support of speech-prosthesis BCI development.
  Presented at the Society for Neuroscience (2022–2024), Duke TBS
  (2022–2023), and AAAS (2025), with additional co-authored posters at the
  Cognitive Neuroscience Society (2024).
</p>

<h2>Skills</h2>
<p>
  Day to day the split is roughly: PyTorch and signal-processing work on
  the decoding side, systems and data-infrastructure work underneath it,
  and regulatory rigor whenever the work touches an actual implanted
  device.
</p>
<div class="skill-groups">
  <div class="skill-group">
    <h3>Programming</h3>
    <p>Python (PyTorch, MNE-Python, NumPy, SciPy, Nipype), C/C++, MATLAB, Bash, CUDA, HTML/Liquid, JavaScript</p>
  </div>
  <div class="skill-group">
    <h3>Signal &amp; data</h3>
    <p>iEEG/ECoG/EEG, fMRI/DTI, BIDS, NWB/DANDI, GPU-accelerated tensor methods, statistics</p>
  </div>
  <div class="skill-group">
    <h3>Platforms</h3>
    <p>GitHub CI/CD, GitHub/GitLab Pages, AWS, Linux, ReadTheDocs, Duke Compute Cluster</p>
  </div>
  <div class="skill-group">
    <h3>Regulatory (academic exposure)</h3>
    <p>Design Controls (21 CFR 820.30), ISO 14971 risk management, predicate-based 510(k) strategy</p>
  </div>
</div>

<h2>Elsewhere</h2>
<p>
  <a href="https://github.com/{{ site.author.github }}">GitHub</a> ·
  <a href="https://www.linkedin.com/in/{{ site.author.linkedin }}">LinkedIn</a> ·
  <a href="mailto:{{ site.author.email }}">{{ site.author.email }}</a>
</p>
