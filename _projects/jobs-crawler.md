---
title: "Job Crawler"
summary: "A multi-source ATS crawler that finds neural-engineering roles by running one pipeline in two postures — relax the location, or relax the domain."
stack: [Python, SQLite, "Claude API", "Gmail SMTP"]
order: 9
repo: https://github.com/Aaronearlerichardson/Jobs
---

## The problem

There aren't many BCI jobs in North Carolina. Rather than write one narrow
search, the crawler runs the same machinery in two postures and lets you
pivot between them:

| Track | Keeps | Relaxes |
|---|---|---|
| **remote-neural** | a neural-signal anchor (BCI/EEG/iEEG/ECoG), a technical bar, clinical mission | location → remote, US-eligible |
| **local-tech** | Triangle/NC location, technical bar, health/bio/science mission | the neural-signal requirement |

Both tracks share the same fetchers, discovery pipeline, company store,
scorers, and parallel fetch pool — they differ only in their gates and
ranking logic.

## Architecture

A SQLite store (`companies` + `jobs` tables) is the single source of
truth. Getting companies *into* the store and getting *jobs* out of it are
separate pipelines:

- **Discovery** (`discover.py`) grows the company roster: Claude-suggested
  employers with slugs probed against ten ATS platforms (Greenhouse,
  Lever, Ashby, Kula, JazzHR, BambooHR, SmartRecruiters, Workday via a
  headless-browser pool), a resolved BCIWiki directory of roughly 700
  neurotech companies, NC-specific sourcing passes, and "ATS dorking"
  (mining search-indexed board URLs).
- **Crawling** (`crawler.py`) polls a declarative ATS registry plus
  RSS/HN/RemoteOK/Remotive/DDG sources through a thread pool, gates each
  posting per-track, and scores survivors with the Claude API for resume
  fit, technical bar, and company mission — company mission is cached
  per-company rather than recomputed per job.
- **Manual capture** (`capture.py`) handles boards that block automation
  (LinkedIn, Indeed): a small local server plus a userscript sends the DOM
  of a page *you* browsed, logged in as yourself, into the same pipeline.
  A plain bookmarklet can't do this — LinkedIn's CSP blocks page-context
  calls to localhost — so the userscript approach exists specifically to
  respect that boundary instead of automating the account directly.

## The interesting problem: precision in a noisy keyword space

A crawler is easy; not surfacing military RF postings or fintech roles
under a search for "signal" and "medical" is the hard part. The keyword
filter tiers terms into CORE (pass alone), DOMAIN+SKILL (must pair, and
only in the posting's head — benefits boilerplate mentions "medical,
dental, vision" too), with short acronyms word-boundary matched so `ecog`
never fires inside "recognized." Remote eligibility is read from
structured ATS fields (Lever's `workplaceType`) before falling back to
regex, and hard negations ("on-site only") veto a match outright. Every
run prints a per-source funnel — relevant → neural → technical → remote →
new — so precision is auditable before anything reaches a digest.

Ranked results are written to markdown reports and, for the classic
keyword-crawl mode, emailed as a digest via Gmail SMTP.
