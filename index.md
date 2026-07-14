---
layout: home
title: null
search_title: Home
summary: "Neural signal processing and BCI engineering — PyTorch decoders, real-time signal processing, and data infrastructure for clinical brain-computer interface research."
permalink: /
---

<section class="hero">
  <div class="hero__text">
    <p class="hero__eyebrow">BCI &amp; Neural Signal Processing</p>
    <h1>Aaron Earle-Richardson</h1>
    <p class="hero__lede">
      I build the software between raw neural signal and a working
      brain-computer interface — PyTorch decoders, real-time
      signal-processing pipelines, and the data infrastructure underneath
      them — for FDA-regulated clinical BCI research.
    </p>
    <div class="hero__actions">
      <a class="button" href="{{ '/projects/' | relative_url }}">See my projects</a>
      <a class="button button--ghost" href="{{ '/about/' | relative_url }}">More about me</a>
    </div>
  </div>
  <img class="hero__photo" src="{{ '/assets/images/aaron-headshot.jpg' | relative_url }}" width="400" height="400" alt="Portrait of Aaron Earle-Richardson">
</section>

<section aria-labelledby="featured-heading">
  <div class="section-heading">
    <h2 id="featured-heading">Featured projects</h2>
    <a href="{{ '/projects/' | relative_url }}">All projects &rarr;</a>
  </div>

  <ul class="project-grid">
    {% assign projects = site.projects | sort: 'order' | slice: 0, 3 %}
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
