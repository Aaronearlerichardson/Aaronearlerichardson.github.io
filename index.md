---
layout: home
title: null
search_title: Home
description: "Neural signal processing and BCI engineering — GPU-accelerated tensor decomposition in PyTorch, the high-gamma pipeline that feeds it, and decoders for intracranial-EEG speech research."
permalink: /
---

<section class="hero">
  <div class="hero__text">
    <p class="hero__eyebrow">First-author iEEG research · Speech BCI</p>
    <h1>Aaron Earle-Richardson</h1>
    <p class="hero__lede">
      I build the analysis behind intracranial-EEG speech research:
      GPU-accelerated tensor decomposition in PyTorch, the high-gamma
      signal-processing pipeline that feeds it, and the decoders that read
      word identity back out. First author on an in-preparation paper
      resolving the parallel neural sub-processes that link hearing a word
      to saying it.
    </p>
    <p class="hero__status">
      <span class="hero__status-dot" aria-hidden="true"></span>
      Currently seeking neural signal processing / BCI engineering roles &mdash;
      open to remote or the NC Research Triangle.
    </p>
    <div class="hero__actions">
      <a class="button" href="{{ '/projects/' | relative_url }}">See my projects</a>
      <a class="button button--ghost" href="{{ '/about/' | relative_url }}">More about me</a>
      <a class="button button--ghost" href="{{ '/assets/files/aaron-earle-richardson-resume.pdf' | relative_url }}" download>Download resume (PDF)</a>
    </div>
  </div>
  <img class="hero__photo" src="{{ '/assets/images/aaron-headshot.jpg' | relative_url }}" width="400" height="400" alt="Portrait of Aaron Earle-Richardson">
</section>

{% assign flagship = site.projects | sort: 'order' | first %}
<section class="flagship" aria-labelledby="flagship-heading">
  <p class="flagship__eyebrow">Flagship — first-author research</p>
  <h2 id="flagship-heading" class="flagship__title">
    <a href="{{ flagship.url | relative_url }}">{{ flagship.title }}</a>
  </h2>
  <p class="flagship__summary">{{ flagship.description }}</p>
  <p class="flagship__meta">Manuscript in preparation · sliceTCA tensor decomposition in PyTorch · iEEG from 31 patients</p>
  <a class="button" href="{{ flagship.url | relative_url }}">Read about the research</a>
</section>

<section aria-labelledby="featured-heading">
  <div class="section-heading">
    <h2 id="featured-heading">More projects</h2>
    <a href="{{ '/projects/' | relative_url }}">All projects &rarr;</a>
  </div>

  <ul class="project-grid">
    {% assign projects = site.projects | sort: 'order' | slice: 1, 3 %}
    {% for project in projects %}
      {% include project-card.html project=project heading="h3" %}
    {% endfor %}
  </ul>
</section>
