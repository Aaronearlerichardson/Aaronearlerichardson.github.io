# Site evaluator

Runs a real evaluation of the site the way a skeptical hiring manager and an
ATS keyword scan would: a technical audit (Lighthouse + axe-core), an
ATS-style keyword-gap analysis against real, currently-open job postings, and
a recruiter-lens rubric — all assembled into one `out/recruiter-report.md`.
Nothing here is invented; every script hits a live site (production or a
local `jekyll serve` build) or a live job board and writes what it actually
finds. Also includes two one-off remediation scripts (`optimize-images.mjs`,
`render-og-image.mjs`) used to act on that report's findings.

Kept out of the Jekyll build (`_config.yml` excludes `tools`) and out of git
(`node_modules/`, `out/`, `out-local/` are gitignored) — this is an audit/
remediation tool, not part of the deployed site.

## Setup

```
npm install
```

Needs a local Chrome install; `audit.mjs` / `fetch-precision-neuro.mjs` point
at `C:\Program Files\Google\Chrome\Application\chrome.exe` — edit `CHROME_PATH`
in those files if Chrome lives elsewhere.

## Pipeline

Run in order (each writes into `out/`, which later steps read):

```
# 1. Real Lighthouse + axe-core run against every live page
npm run audit

# 2. Real rendered text of every live page (for the keyword analysis)
npm run extract-site-text

# 3. Real live JDs for Aaron's target companies, via the Jobs crawler's own
#    fetchers (run from the Jobs repo — see below), plus Precision
#    Neuroscience separately since its careers site is client-rendered and
#    the crawler's static-HTML fetcher can't see its listings
cd ../../../Jobs && python fetch_target_jds.py && cd -
npm run fetch-precision-neuro

# 4. Keyword-gap analysis: real JD text vs real site text (also folds in
#    out/jds.json if present — a Neuralink haul from an earlier session's
#    fetch script, kept as a read-only bonus data source)
npm run analyze

# 5. Assemble everything (plus a few live re-verified facts: og:image,
#    resume presence, contact email count) into out/recruiter-report.md
npm run report
```

Or just `npm run all` for steps 1, 2, 4, 5 (step 3's cross-repo fetch has to
be run separately since it lives in a different repo — `../../../Jobs` from
here, i.e. `C:\Users\Jakda\git\Jobs`).

To audit a local build instead of production (e.g. to verify a fix before
deploying), run `bundle exec jekyll serve` in the site root, then
`BASE_URL=http://127.0.0.1:4000 node audit.mjs` — writes to `out-local/`
instead of `out/` so it never clobbers the production baseline.

## What each script does

- `audit.mjs` — Lighthouse (performance/accessibility/best-practices/SEO) +
  axe-core against every page in `pages.json`. Writes `audit.json` and
  per-page Lighthouse reports to `lighthouse/`, under `out/` (or `out-local/`
  when `BASE_URL` is set).
- `extract-site-text.mjs` — renders every page and dumps `document.body.innerText`
  to `out/site-text.json`.
- `fetch-precision-neuro.mjs` — `careers.kula.ai` (Precision Neuroscience's
  board) is a client-rendered Next.js app; static HTML fetches see zero jobs.
  Renders it with the same headless Chrome and reads the DOM post-hydration.
  Writes `out/precision-neuroscience-jobs.json`.
- `analyze.mjs` — cross-references a hand-curated, JD-grounded keyword list
  against `out/target_jds.json` (written by the Jobs-repo script),
  `out/precision-neuroscience-jobs.json`, and `out/site-text.json`. Writes
  `out/keyword-coverage.json` (gaps / covered / site-only, each with citations).
- `build-report.mjs` — pulls the numbers out of `out/audit.json` and
  `out/keyword-coverage.json`, live-re-verifies a few binary facts (og:image,
  resume link, preprint link, contact-email count) so the report can't drift
  from the deployed site, and writes `out/recruiter-report.md`. The
  recruiter-lens rubric and the impact-ordered findings list are
  hand-authored judgment calls — that can't be computed — but every citation
  in them is a literal fetched quote, not a guess.
- `optimize-images.mjs` — one-off remediation: resizes the project-page CAD
  renders/diagrams to their real display width and emits a WebP sibling +
  recompressed fallback for each. Run once; not part of the audit pipeline.
- `render-og-image.mjs` — renders `og-image.html` (hand-drawn signal/electrode
  motif, not a paper figure) at 1200×630 via headless Chrome to produce
  `assets/images/og-card.png`, the site's social-share card.

`out/post-fix-verification.md` is a one-time before/after Lighthouse
comparison written after the Stage 2 remediation pass — not part of the
regular pipeline, kept for the record.

`../Jobs/fetch_target_jds.py` (in the `Jobs` repo, not this one) imports that
repo's own ATS fetchers (`jobcrawler.fetchers.*`) directly and calls them for
Beacon Biosignals, Paradromics, Ceribell, and Precision Neuroscience — real
reuse of the existing crawler, not a re-implementation.
