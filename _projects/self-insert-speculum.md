---
title: "Self-Inserting Speculum"
description: "A medical-device redesign of the vaginal speculum around patient comfort — a device the patient inserts and controls herself, rather than a cold, provider-operated instrument."
stack: [CAD, "Medical Device Design", "Human Factors"]
order: 13
thumbnail: /assets/images/thumb-self-insert-speculum.jpg
thumbnail_webp: /assets/images/thumb-self-insert-speculum.webp
thumbnail_alt: "Still from the CAD animation: the speculum's handle, bills, and adjustment mechanism shown assembled."
---

A human-centered redesign of the vaginal speculum. The starting point
wasn't the mechanism — it was a simple observation about pain: the same
small procedure hurts less when you do it to yourself than when someone
else does it to you (tweezing a hair, pinching your own skin). The
standard Sim's speculum is the opposite of that — cold, it clicks, and it
puts the patient in stirrups while a clinician operates the instrument.
This project asks what a speculum looks like if the patient inserts and
controls it herself.

<figure class="figure">
  <video controls loop muted playsinline preload="metadata" poster="{{ '/assets/images/speculum-anim-poster.jpg' | relative_url }}" width="1280" height="720">
    <source src="{{ '/assets/video/speculum.mp4' | relative_url }}" type="video/mp4">
    Your browser can't play this video — <a href="{{ '/assets/video/speculum.mp4' | relative_url }}">download the MP4</a>.
  </video>
  <figcaption>CAD animation of the device — the handle, the bills, and the adjustment mechanism, shown assembled and exploded. The form factor is designed to be gripped and inserted by the patient rather than operated from the far side of an exam table.</figcaption>
</figure>

## The idea

The design borrows its insertion model from something patients already use
themselves comfortably — the tampon — and reframes the exam as
patient-controlled rather than clinician-controlled. That's not just a
comfort nicety: user research motivated the direction. In a survey of
roughly 200 women, most of those offered a self-exam agreed to it, and the
overwhelming majority reported the experience as positive. A device that
lets the patient do the insertion herself turns an anxiety-laden,
provider-driven procedure into one she has agency over.

## The design work

My contribution was the industrial and mechanical design: the CAD model in
the animation above — the ergonomic handle sized for self-insertion, the
bill geometry, and the internal adjustment mechanism that opens the bills
once positioned. The whole shape is driven by the human-factors goal: it
has to be something a patient can hold, orient, and actuate on herself,
which is a very different constraint set from an instrument designed to be
operated by a second person.

<p class="private-note">
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor"><path d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3Zm0 1.5A1.5 1.5 0 0 1 9.5 4v2h-3V4A1.5 1.5 0 0 1 8 2.5Z"/></svg>
  A university medical-device design project — no public repo. The animation is my own CAD render; the description is drawn from the project's own materials.
</p>
