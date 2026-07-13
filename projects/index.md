---
layout: default
title: Projects
permalink: /projects/
---

<h1>Projects</h1>
<p>A few things I've built, from a job-search crawler with real precision
problems to a from-scratch probability engine for tabletop dice.</p>

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
