---
title: "Clinical EEG Alert System"
description: "A client/server system that routes EEG data from bedside to database to a physician, with a 3D electrode-review GUI at the end of the chain."
stack: [Python, Flask, Tkinter, MNE]
order: 5
repo: https://github.com/Aaronearlerichardson/Server_gui_client
---

A graduate systems-design project (Duke BME 547, built with a partner)
built around a realistic clinical workflow rather than a toy CRUD app: get
EEG data from a bedside device to the physician who needs to act on it,
with a human in the loop at every handoff.

<figure class="figure">
  <picture>
    <source srcset="{{ '/assets/images/clinical-eeg-diagram.webp' | relative_url }}" type="image/webp">
    <img src="{{ '/assets/images/clinical-eeg-diagram.png' | relative_url }}" width="1280" height="720" loading="lazy" alt="System data-flow: a bedside EEG trace (normal, pre-seizure, and seizure phases color-coded) raises an ALERT, which fans out to Save to Database, the Nurse's Station, and an Email to the attending physician, which links to a server-based 3D-brain review GUI; the loop returns to the patient.">
  </picture>
  <figcaption>The end-to-end workflow: a seizure-classified EEG trace triggers an alert that fans out to the database, the nurse's station, and an email to the attending — who opens a server-rendered 3D electrode-review GUI.</figcaption>
</figure>

## The pipeline

1. A Tkinter client posts EEG data (name, patient ID/MRN, heart rate, and
   the ECG trace itself) to a Flask server as JSON.
2. The server stores it in an in-memory database keyed on MRN — new data
   for an existing MRN overwrites in place — and raises an alert.
3. That alert is pushed to a nurse's station GUI, where the nurse
   confirms they've attended to the patient and logs qualitative notes
   back to the server.
4. The server emails the attending physician a link to a server-rendered
   page showing a 3D rendering of the brain for identifying the
   significant electrode contacts, built on MNE's electrode-localization
   tooling. The physician's electrode picks are POSTed back and stored
   against that patient's record for later seizure-focus review.

## Server API

A small REST surface carries the whole workflow: `POST /new_patient`
upserts a patient's data (only `patient_id` is required); `GET /get`
returns every patient on file; `GET /get/<mrn_or_name>` looks up one
patient by MRN or name (falling back to the most recent MRN on a name
collision); `GET /get/<mrn_or_name>/image` renders the stored ECG trace as
an HTML page. The database itself is a small class wrapping a list of
dictionaries, with per-key attribute lists kept in sync as entries are
appended — enough structure for fast lookups without pulling in a real
database engine for a project of this scope.

## Client-side

The Tkinter client reads a local ECG CSV, plots it with matplotlib, and
computes heart rate from the trace before sending everything to the
server. The same client pulls existing patient records back down from a
dropdown of MRNs already on the server, so the "browse a local file" and
"look up what's already stored" paths share one interface.
