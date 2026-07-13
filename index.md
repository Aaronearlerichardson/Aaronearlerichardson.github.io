---
layout: home
title: null
permalink: /
---

<section class="hero">
  <p class="hero__eyebrow">Duke University — Cogan Lab</p>
  <h1>Aaron Earle-Richardson</h1>
  <p class="hero__lede">
    I build data pipelines and analysis software for intracranial
    neuroscience — turning high-density μECoG and iEEG recordings into
    signal a brain-computer interface can act on. Scientific Data Manager
    at Duke, working under FDA IDE and IRB oversight on speech-BCI
    research.
  </p>
  <div class="hero__actions">
    <a class="button" href="{{ '/projects/' | relative_url }}">See my projects</a>
    <a class="button button--ghost" href="{{ '/about/' | relative_url }}">More about me</a>
  </div>
</section>

<section aria-labelledby="featured-heading">
  <div class="section-heading">
    <h2 id="featured-heading">Featured projects</h2>
    <a href="{{ '/projects/' | relative_url }}">All projects &rarr;</a>
  </div>

  <ul class="project-grid">
    {% assign projects = site.projects | sort: 'order' %}
    {% for project in projects %}
    <li>
      <a class="card" href="{{ project.url | relative_url }}">
        <h3>{{ project.title }}</h3>
        <p>{{ project.summary }}</p>
        {% if project.stack %}
        <ul class="tag-list" aria-label="Technologies used">
          {% for item in project.stack %}<li class="tag">{{ item }}</li>{% endfor %}
        </ul>
        {% endif %}
      </a>
    </li>
    {% endfor %}
  </ul>
</section>
