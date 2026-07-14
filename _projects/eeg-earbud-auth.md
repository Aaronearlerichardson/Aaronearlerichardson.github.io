---
title: "EEG Earbud Biometric Authentication"
summary: "An in-ear EEG device for personal identification, small enough to fit inside an earbud — led the team through a classical-ML classifier and its transition to deep learning."
stack: [MATLAB, Machine Learning]
order: 11
---

Led a team building a personal-identification system around EEG signal
recorded from inside the ear canal — biometric authentication small
enough to actually wear, rather than a lab-bench EEG cap.

The first working version used a classical machine-learning classifier
built in MATLAB on hand-selected EEG features. The project's harder
problem turned out to be motion artifacts: an in-ear sensor moves with
the wearer in a way a stationary EEG rig doesn't, and those artifacts were
swamping the signal the classifier depended on. That drove the project's
main evolution — moving from the hand-tuned classical classifier to deep
neural networks that could learn to reject motion artifacts directly
instead of relying on manual feature engineering to filter them out
upstream.

<p class="private-note">
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor"><path d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3Zm0 1.5A1.5 1.5 0 0 1 9.5 4v2h-3V4A1.5 1.5 0 0 1 8 2.5Z"/></svg>
  No public repo for this one — it predates my current practice of publishing lab/personal code, so this description is drawn from my own project records rather than source I can link to.
</p>
