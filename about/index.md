---
layout: default
title: About
permalink: /about/
description: "Bio, education, and skills for Aaron Earle-Richardson — neural signal processing and BCI engineering."
---

<h1>About</h1>

<img class="about-portrait" src="{{ '/assets/images/aaron-headshot.jpg' | relative_url }}" width="400" height="400" alt="Portrait of Aaron Earle-Richardson">

<p class="hero__status">
  <span class="hero__status-dot" aria-hidden="true"></span>
  Currently seeking neural signal processing / BCI engineering roles &mdash;
  open to remote or the NC Research Triangle.
</p>

<p>
  <a class="button" href="{{ '/assets/files/aaron-earle-richardson-resume.pdf' | relative_url }}" download>Download resume (PDF)</a>
</p>

<p>
  I'm a neural signal processing and BCI engineer. My largest project is a
  <a href="{{ '/projects/speech-subprocesses/' | relative_url }}">first-author
  study</a> on the neural sub-processes that link speech perception and
  production — a PyTorch tensor decomposition (sliceTCA) over
  intracranial-EEG recordings from 31 patients — and most of my PyTorch and
  signal-processing experience comes from building and scaling it. Most
  recently, in the <a href="https://github.com/coganlab">Cogan Lab</a> at
  Duke University's Department of Neurology, I also worked with high-density
  &mu;ECoG arrays (up to 1024 channels) recorded intraoperatively at Duke
  University Medical Center — a collaboration spanning Duke Neurology,
  Neurosurgery, and the Viventi Lab's hardware engineering team, under FDA
  Investigational Device Exemption and Duke IRB oversight.
</p>

<p>
  I built and maintained <a href="https://ieeg-pipelines.readthedocs.io/en/latest/">IEEG_Pipelines</a>,
  the lab's open-source iEEG/ECoG analysis stack (BIDS conversion, PHI
  removal for NWB/DANDI compliance, GPU-accelerated signal processing).
  Every change ships through code review on pull requests, tested across
  three OSes via GitHub Actions before merging; 1,243 of its 1,423 commits
  are mine, version-controlled in Git alongside the co-maintainer I trained
  and other contributors. Fittingly, this site's color palette and type
  are modeled directly on its documentation theme.
</p>

<p>
  This site is itself hand-built — no theme,
  no framework — including the search box above and the light/dark toggle;
  see the <a href="{{ '/colophon/' | relative_url }}">colophon</a> for how
  it's put together.
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
    maintained BIDS-standard systems with PHI removal for
    NWB/DANDI compliance; authored and version-controlled analysis pipelines;
    led the lab's migration from MATLAB/Windows to a Python/Linux stack,
    managing a live clinical pipeline cutover across the whole lab.
  </li>
  <li>
    <time>Apr 2021 – Dec 2024</time>
    <strong>Research Technician II</strong> — Duke Department of Neurology (Cogan Lab).
    Converted lab data systems to the BIDS standard; built new ECoG/iEEG
    analysis pipelines; supported intracranial recording research through
    that same cross-functional collaboration — clinical, surgical, and
    hardware engineering — described above.
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

<h2>Publications &amp; presentations</h2>

<p class="pub-lead"><strong>First-author manuscript (in preparation):</strong></p>
<ul class="pub-list">
  <li>
    Earle-Richardson, A. M., Duraivel, K., Southwell, D., Sinha, S.,
    Vestal, M., Grant, G., Zafar, M., &amp; Cogan, G. B.
    <em>Neural sub-processes linking speech perception and production.</em>
    <span class="pub-status">Manuscript in preparation</span> — presented as
    posters at the Society for Neuroscience (2022–2024), Duke TBS
    (2022–2023), and AAAS (2025).
    <a href="{{ '/projects/speech-subprocesses/' | relative_url }}">Read more &rarr;</a>
  </li>
</ul>

<p class="pub-lead"><strong>Selected co-authored presentations:</strong></p>
<ul class="pub-list">
  <li>
    Sexton, D. P., Earle-Richardson, A. M., Southwell, D. G., Vestal, M., &amp;
    Cogan, G. B. Decoding verbal working memory load from intracranial high
    gamma activity. AAAS, 2025.
  </li>
  <li>
    Zhang, J., Earle-Richardson, A. M., Southwell, D., Egner, T., &amp;
    Cogan, G. B. Intracranial EEG correlates of concurrent demands on
    cognitive stability and flexibility. Society for Neuroscience, 2024;
    Cognitive Neuroscience Society, 2024.
  </li>
</ul>

<h2>Skills</h2>
<p>
  Day to day the split is: PyTorch and GPU work on the tensor-decomposition
  side (sliceTCA), classical ML (PCA-LDA, scikit-learn) for the decoders,
  and the high-gamma signal processing and data infrastructure underneath
  both.
</p>
<div class="skill-groups">
  <div class="skill-group">
    <h3>Programming</h3>
    <p>Python (PyTorch, MNE-Python, NumPy, SciPy, scikit-learn, Nipype), C/C++, MATLAB, Bash, CUDA, HTML/Liquid, JavaScript</p>
  </div>
  <div class="skill-group">
    <h3>Signal &amp; data</h3>
    <p>iEEG/ECoG/EEG, fMRI/DTI, high-gamma extraction, GPU-accelerated tensor decomposition (sliceTCA), time-resolved decoding, permutation statistics, BIDS, NWB/DANDI</p>
  </div>
  <div class="skill-group">
    <h3>Platforms</h3>
    <p>GitHub CI/CD, GitHub Pages, AWS, Linux, ReadTheDocs, Duke Compute Cluster</p>
  </div>
  <div class="skill-group">
    <h3>Regulatory</h3>
    <p>Design Controls (21 CFR 820.30), ISO 14971 risk management, predicate-based 510(k) strategy</p>
  </div>
</div>

<h2>Elsewhere</h2>
<p>
  <a href="https://github.com/{{ site.author.github }}">GitHub</a> ·
  <a href="https://www.linkedin.com/in/{{ site.author.linkedin }}">LinkedIn</a> ·
  <a href="mailto:{{ site.author.email }}">{{ site.author.email }}</a>
</p>
