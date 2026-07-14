---
layout: default
title: Projects
permalink: /projects/
description: "Projects by Aaron Earle-Richardson, spanning BCI benchmarking, clinical data systems, neuroimaging infrastructure, and hand-rolled probability/signal tools."
---

<h1>Projects</h1>
<p>Things I've built outside formal job duties — a benchmark for
BCI-style selection interfaces, a precision-engineered job crawler,
clinical and neuroimaging data infrastructure, a spiking-neuron
simulator, and a couple of from-scratch probability and signal-processing
tools. The same engineering habits show up throughout: careful about
what a system actually needs versus what it's tempting to build.</p>

<ul class="project-grid">
  {% assign projects = site.projects | sort: 'order' %}
  {% for project in projects %}
    {% include project-card.html project=project heading="h2" %}
  {% endfor %}
</ul>
