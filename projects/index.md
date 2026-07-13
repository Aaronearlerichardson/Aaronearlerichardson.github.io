---
layout: default
title: Projects
permalink: /projects/
summary: "Projects by Aaron Earle-Richardson: a BCI-relevant selection benchmark, a precision-engineered job crawler, and hand-rolled probability/signal tools."
---

<h1>Projects</h1>
<p>A few things I've built outside the lab — same engineering habits show
up in all of them: a benchmark for BCI-style selection interfaces, a
job crawler built around a genuinely hard precision problem, and a pair
of from-scratch probability and signal-processing tools.</p>

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
