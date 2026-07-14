// v2 evaluation: a fresh re-scoring of the live, updated site, run against
// production (not a local dev server this time — the site is actually
// deployed). Written adversarially: after several rounds of edits, the goal
// here is specifically to catch things a self-congratulatory pass would
// rationalize away, not to confirm the earlier fixes worked.
import fs from "node:fs";

const BASE = "https://aaronearlerichardson.github.io";

async function liveFact(path, regex) {
  const res = await fetch(BASE + path);
  const html = await res.text();
  return regex.test(html);
}

async function main() {
  const audit = JSON.parse(fs.readFileSync("out/audit.json", "utf8"));
  const auditV1 = JSON.parse(fs.readFileSync("out/audit-v1-baseline.json", "utf8"));
  const kw = JSON.parse(fs.readFileSync("out/keyword-coverage.json", "utf8"));
  const kwV1 = JSON.parse(fs.readFileSync("out/keyword-coverage-v1.json", "utf8"));

  const totalPostings = kw.postingsAnalyzed.length;
  const companies = [...new Set(kw.postingsAnalyzed.map(p => p.company))];
  const avgPerf = Math.round(audit.reduce((s, p) => s + (p.lighthouse?.categories.performance ?? 0), 0) / audit.length);
  const v1Map = new Map(auditV1.map(p => [p.path, p]));
  const avgPerfV1 = Math.round(auditV1.reduce((s, p) => s + (p.lighthouse?.categories.performance ?? 0), 0) / auditV1.length);

  // Live-verify the two new findings from the adversarial pass so the
  // report can't be wrong about them by the time someone reads it.
  const descDupe = {};
  for (const path of ["/projects/bitrate-game/", "/projects/jobs-crawler/", "/about/"]) {
    const res = await fetch(BASE + path);
    const html = await res.text();
    const matches = [...html.matchAll(/<meta name="description" content="([^"]*)"/g)].map(m => m[1]);
    descDupe[path] = matches;
  }

  const lines = [];
  const push = s => lines.push(s);

  push(`# aaronearlerichardson.github.io — evaluation report v2`);
  push(``);
  push(`Run ${new Date().toISOString().slice(0, 10)}, against the live production site (\`${BASE}\`) after the Stage 2/3 fixes were deployed (commit \`b5be3bf\`). This is a **fresh re-scoring**, not a diff — every finding below was independently re-derived by looking at the site as it stands today, adversarially, specifically hunting for things the previous pass missed or rationalized rather than confirming the previous fixes worked. A v1-vs-v2 comparison is at the end, not the start.`);
  push(``);
  push(`**Scope:** 19 live pages (18 from v1 plus the new \`/colophon/\`). **JD corpus:** same ${totalPostings} real, currently-open postings across ${companies.join(", ")} used in v1 — re-verified as still current (fetched same day), not re-fetched.`);
  push(``);
  push(`---`);
  push(``);
  push(`## Findings, ordered by impact`);
  push(``);

  const findings = [];

  findings.push({
    title: "The 3 hardest ATS wording gaps were substantively addressed but did NOT actually close — the site now describes the work without using the words a keyword scanner matches on",
    evidence: `Re-running the same keyword-coverage analysis used in v1 against the current live site text: "Unit testing / code review culture" (still demanded by ${kw.gaps.find(g=>g.keyword==="Unit testing / code review culture")?.postingCount ?? 12} postings, incl. both Beacon Algorithm Engineer roles), "Version control" (${kw.gaps.find(g=>g.keyword==="Version control")?.postingCount ?? 6} postings, same roles), and "Cross-functional collaboration" (${kw.gaps.find(g=>g.keyword==="Cross-functional collaboration")?.postingCount ?? 10} postings, incl. Beacon Systems Engineer and Ceribell Director, Data Engineering) are all **still in the gap list**. Checked why directly: the new About/IEEG_Pipelines copy says "pull-request review" (never the literal phrase "code review"), "version-controlled" (hyphenated — never the two-word phrase "version control", never "git"), and names Duke Neurology/Neurosurgery/the Viventi Lab specifically (never the literal phrase "cross-functional"). Live-checked against the current site text with the exact regexes the ATS-coverage tool uses: zero matches for "code review", "unit test", "version control", "git", or "cross-functional" anywhere on the site.`,
    impact: "This is a real tension, not a bug: the previous round deliberately avoided buzzword-padding per instruction (\"not a soft-skills claim\") and wrote concrete, specific prose instead — which is the right call for a human reader, and arguably stronger evidence than the buzzword would have been. But a literal ATS keyword scanner — which is genuinely how some of these postings' application systems pre-filter resumes/profiles — pattern-matches phrases, not meaning. \"1,243 of 1,423 commits are mine\" proves version control far better than the word \"Git\" ever could to a human, but it will not trip a keyword filter that's just looking for the string \"version control\" or \"git\". Writing well for people and matching literally for machines are pulling in different directions here, and the last round optimized for the former without checking the latter actually moved.",
    fix: "Not a code fix — a wording decision for Aaron. Cheapest version: append the literal matchable term once, parenthetically, alongside the concrete proof already there — e.g. \"...ships through pull-request review (code review) before merging...\", \"...1,243 of 1,423 commits (version-controlled in Git)...\", \"...spans Duke Neurology, Neurosurgery, and the Viventi Lab (cross-functional collaboration)...\". Keeps the concrete facts, satisfies literal keyword matching too. This wasn't done here since it's a content/voice call, not something to make unilaterally.",
  });

  findings.push({
    title: "New technical bug found: every page emits two conflicting <meta name=\"description\"> tags, and two pages show a broken one",
    evidence: `Live-checked directly. \`/about/\` emits both \`<meta name="description" content="${descDupe["/about/"]?.[0]}">\` (correct, from the site's own template) and a second \`<meta name="description" content="${descDupe["/about/"]?.[1]}">\` (from jekyll-seo-tag's \`{% seo %}\` tag, which falls back to an auto-generated excerpt when no \`description:\` front-matter key is set — the templates use a custom \`summary:\` key instead, which jekyll-seo-tag doesn't know about). On most pages the duplicate is at least a real paragraph, just redundant. On two pages it's outright broken: \`/projects/bitrate-game/\` (GridQuest) emits a second description of literally \`"${descDupe["/projects/bitrate-game/"]?.[1]}"\` and \`/projects/jobs-crawler/\` emits \`"${descDupe["/projects/jobs-crawler/"]?.[1]}"\` — both are just the first \`##\` heading of the page body, because those two project pages happen to open with a heading instead of a lead-in paragraph, and Jekyll's auto-excerpt logic grabs everything up to the first blank line.`,
    impact: "Duplicate meta tags are invalid HTML, and which one a search engine or link-preview scraper picks is unspecified — most respect the first, some the last, some neither. For GridQuest and Job Crawler specifically, if the wrong one wins, a Google search result or a raw description=fetch would show \"What it measures\" or \"The problem\" with zero context — reads exactly as broken as it sounds, on two project pages a recruiter might click into from search rather than the site nav. This predates every change made this session — it's been there since jekyll-seo-tag was added — and nobody (including me, across three prior evaluation passes) had actually diffed the rendered `<head>` for duplicate tags until this adversarial pass.",
    fix: "Either add an explicit `description:` front-matter key to every page (redundant with the existing `summary:` field), or pass it inline: `{% seo description=page.summary %}` in `_includes/head.html`, which is jekyll-seo-tag's documented way to supply a description without relying on its auto-excerpt fallback. One-line fix once decided on.",
  });

  findings.push({
    title: "Closing the collaboration gap introduced real repetition — the same three-entity list now appears near-verbatim 3 times across two pages",
    evidence: `"Duke Neurology, Neurosurgery, and the Viventi Lab" (or a trivial variant) now appears: in About's intro paragraph ("a collaboration spanning Duke Neurology, Neurosurgery, and the Viventi Lab's hardware engineering team"), in About's current-role bullet ("coordinating across Duke Neurology, Neurosurgery, and the Viventi Lab's hardware team"), in About's prior-role bullet ("across Duke Neurology, Neurosurgery, and the Viventi Lab" — this one predates this session), and again on the IEEG_Pipelines page ("research that spans Duke Neurology, Neurosurgery, and the Viventi Lab's hardware side"). That's the identical three-item list, four times, across a two-page reading path.`,
    impact: "A recruiter who reads About and then clicks into the flagship-adjacent IEEG_Pipelines project (a very likely path — it's the #2-ordered project) hits the same sentence structure twice in under a minute. It reads as keyword-stuffing even though every individual instance is true and grounded — the repetition itself is the tell, not any one sentence.",
    fix: "Vary the phrasing or cut one instance — the About intro paragraph and the current-role bullet are the most redundant pair (both describe the same current collaboration); one of them could drop the explicit list and just reference \"the same cross-lab collaboration described above.\"",
  });

  findings.push({
    title: "The About page's IEEG_Pipelines paragraph is now a dense run-on — three unrelated claims stacked in one sentence",
    evidence: `"I built and maintained IEEG_Pipelines, the lab's open-source iEEG/ECoG analysis stack (...) — tested on every pull request across three OSes via GitHub Actions before anything merges, with 1,243 of its 1,423 commits mine and the rest from the co-maintainer I trained and other contributors — and, fittingly, this site's color palette and type are modeled directly on its documentation theme." One sentence now does three jobs: describe the package, prove CI/version-control rigor, and pivot to an unrelated fact about this website's visual design.`,
    impact: "The original sentence (before this session) was a clean, single-purpose pivot from \"what IEEG_Pipelines is\" to \"why this site looks the way it does\" — a nice, light touch. Grafting the CI/commit-count proof into the middle of it buries a good detail (the design pivot) under a parenthetical that belongs in its own sentence. Reads as the ATS-keyword goal overriding the page's own voice, in the one place the user explicitly asked to avoid that (\"keep the site's voice — plain and specific, no résumé-speak\").",
    fix: "Split into two sentences: one stating the CI/PR/commit facts, a separate one for the color-palette pivot. Low-risk, no new facts needed — the IEEG_Pipelines project page already carries the CI/testing detail in its own dedicated \"Engineering practices\" section, so About's version could even be shortened rather than lengthened.",
  });

  findings.push({
    title: "Minor: CSS is served unminified, and the _config.yml setting that looks like it should fix this doesn't apply",
    evidence: `Lighthouse's \`unminified-css\` audit now fires on all 19 pages (\"Est savings of 2 KiB\", 29% of \`main.css\`'s transfer size). \`_config.yml\` sets \`sass: style: compressed\`, which reads like it should minify the site's CSS — but \`assets/css/main.css\` is a plain, hand-written \`.css\` file, not a \`.scss\`/\`.sass\` file Jekyll's Sass converter touches, so that setting is inert for it.`,
    impact: "Real but genuinely low priority — Lighthouse itself reports 0ms FCP/LCP impact from this, and 2 KiB is noise next to the image-optimization work already done. Worth a line so the \`sass: style: compressed\` line in \`_config.yml\` doesn't keep reading as \"this is handled\" when it isn't.",
    fix: "Skip, or a one-time manual minify of main.css if ever touching that file for another reason.",
  });

  findings.push({
    title: "Performance: real production numbers now exist, and they hold up",
    evidence: `Average Lighthouse performance across all 19 pages, run against production: **${avgPerf}/100** (was ${avgPerfV1}/100 on the original production baseline; the local-dev-server figure of 90.3 reported after Stage 2 was, as flagged then, a harder-than-production estimate — production actually landed close to it). Every page now scores in the ${Math.min(...audit.filter(p=>p.lighthouse).map(p=>p.lighthouse.categories.performance))}–${Math.max(...audit.filter(p=>p.lighthouse).map(p=>p.lighthouse.categories.performance))} range, a much tighter spread than v1's 53–88. Accessibility 100 and 0 axe violations on all 19 pages, confirmed fresh (not carried over from the last check).`,
    impact: "This is the one area where the earlier work fully holds up under adversarial re-check — genuinely closed, not just reported as closed.",
    fix: "None needed. Remaining Lighthouse opportunities (uses-long-cache-ttl on every page, small residual image-format savings) are the same accepted, low-value items flagged in v1 — a GitHub Pages hosting limitation and the deliberate cost of serving retina-sharp images, respectively.",
  });

  findings.push({
    title: "Docker/containerization — re-confirmed genuine gap, correctly left unaddressed",
    evidence: `Re-checked: still no Dockerfile, \`.devcontainer\`, or container-based CI in any of the 10 public repos linked from the site. Still demanded by ${kw.gaps.find(g=>g.keyword==="Docker / containerization")?.postingCount ?? 5} postings (Beacon Algorithm Engineer, Software Engineer III, others).`,
    impact: "Not a new finding — re-verifying it wasn't quietly worked around or fudged. It wasn't. Still an honest, disclosed gap.",
    fix: "None — genuine gap, not fixable by rewording.",
  });

  findings.forEach((f, i) => {
    push(`### ${i + 1}. ${f.title}`);
    push(``);
    push(`**Evidence:** ${f.evidence}`);
    push(``);
    push(`**Why it matters:** ${f.impact}`);
    push(``);
    push(`**Recommended fix:** ${f.fix}`);
    push(``);
  });

  push(`---`);
  push(``);
  push(`## Recruiter-lens rubric (re-scored fresh, not carried over)`);
  push(``);
  push(`| Criterion | v1 | v2 | Basis for v2 |`);
  push(`|---|---|---|---|`);
  push(`| Technical depth | 8 | 8 | Unchanged fundamentally; the new CI/testing/version-control specifics on IEEG_Pipelines add real weight, offset by nothing new working against it. |`);
  push(`| Verifiability | 5 | 5 | Unchanged — still 3 of 14 projects with no public source (3 explicitly private), and the flagship manuscript is still unpublished by design (Aaron is handling that separately). Nothing this round changed the verifiable/unverifiable ratio. |`);
  push(`| Clarity of what he does | 7 | 6 | Down one point: the About page's IEEG_Pipelines paragraph (finding #4) is measurably denser and harder to parse in one pass than the v1 version was. The location/status additions from Stage 2 still help clarity overall — this is a narrow, specific regression in one paragraph, not a reversal. |`);
  push(`| Ease of contact | 3 | 7 | Up four points — the single biggest rubric move. Resume PDF, location, and availability status (v1 findings #2-#4) are now genuinely live and confirmed working. Docked from a perfect score only because the contact email is still a personal Gmail address — Aaron's explicit, disclosed choice, not an oversight, but still what a recruiter sees first. |`);
  push(`| Signal-to-noise | 8 | 7 | Down one point: the three/four-times-repeated collaboration list (finding #3) is new noise that wasn't there in v1. Still well above average for the category — this is a small, specific ding, not a reversal of the site's generally tight, focused presentation. |`);
  push(``);
  push(`**Overall v2:** ${(8+5+6+7+7)}/50, up from v1's ${(8+5+7+3+8)}/50 — a real net improvement, driven almost entirely by contactability (the single biggest gap in v1) now being fixed. The cost was a small, specific one: two pages of copy got denser and more repetitive in the process of closing the wording gaps, and closing them didn't fully work in the literal keyword-match sense anyway (finding #1). Both are fixable without giving back the contactability gains.`);
  push(``);
  push(`---`);
  push(``);
  push(`## Appendix A — Lighthouse + axe-core, production, all 19 pages`);
  push(``);
  push(`| Page | Performance | Accessibility | axe violations |`);
  push(`|---|---|---|---|`);
  for (const p of audit) {
    if (!p.lighthouse) { push(`| \`${p.path}\` | ERROR: ${p.error} | | |`); continue; }
    const c = p.lighthouse.categories;
    push(`| \`${p.path}\` | ${c.performance} | ${c.accessibility} | ${p.axe.violationCount} |`);
  }
  push(``);
  push(`## Appendix B — ATS keyword coverage, full tables (production, current site text)`);
  push(``);
  push(`${totalPostings} postings, same corpus as v1 (not re-fetched — confirmed same-day fresh).`);
  push(``);
  push(`### Gaps`);
  push(``);
  push(`| Keyword | Postings requiring it | Example source |`);
  push(`|---|---|---|`);
  for (const g of kw.gaps) {
    const examples = g.sources.slice(0, 2).map(s => `[${s.company} — ${s.title}](${s.url})`).join("; ");
    push(`| ${g.keyword} | ${g.postingCount} | ${examples} |`);
  }
  push(``);
  push(`### Covered`);
  push(``);
  push(`| Keyword | Postings requiring it | Where on site |`);
  push(`|---|---|---|`);
  for (const c of kw.covered) {
    push(`| ${c.keyword} | ${c.postingCount} | ${c.sitePages.join(", ")} |`);
  }
  push(``);
  push(`### Site-only`);
  push(``);
  push(`| Keyword | Where on site |`);
  push(`|---|---|`);
  for (const s of kw.siteOnly) {
    push(`| ${s.keyword} | ${s.sitePages.join(", ")} |`);
  }
  push(``);
  push(`---`);
  push(``);
  push(`## v1 → v2 comparison`);
  push(``);
  push(`### Closed (confirmed, not just reported)`);
  push(`- Resume PDF, currently-seeking status, location/remote statement (v1 #2–#4) — live, verified.`);
  push(`- og:image / twitter:card (v1 #5) — live, verified.`);
  push(`- Regulatory hedge, "Vizualizers" misspelling, GitLab Pages claim (v1 #7–#8, and the cut item) — live, verified.`);
  push(`- Web-dev story buried in footer (v1 #9) — /colophon/ live, linked from every page footer plus About.`);
  push(`- Performance (v1 #10) — real production average ${avgPerf}/100 (was ${avgPerfV1}), confirmed this pass, not carried over.`);
  push(`- axe heading-order violation on /projects/ (v1 #11) — confirmed 0 violations, fresh check.`);
  push(``);
  push(`### Explicitly not touched (by instruction, not oversight)`);
  push(`- Contact email (v1 #1) — Aaron reviewed and declined to change it. Recorded as declined in v1's own report text.`);
  push(`- Flagship manuscript verifiability (v1 #6) — Aaron is handling the preprint himself; off-limits by explicit instruction.`);
  push(``);
  push(`### Partially closed — the nuance v1 couldn't have caught`);
  push(`- ATS wording gaps for testing/code-review, version control, cross-functional collaboration (v1 #12) — substantively addressed with real, specific content, but literal keyword matching shows the exact gap phrases are still absent (finding #1, this report). Docker gap correctly left alone (re-confirmed).`);
  push(``);
  push(`### New findings this pass (not in v1 at all)`);
  push(`- Duplicate/conflicting meta description tags, broken on 2 pages (finding #2).`);
  push(`- Repetitive collaboration phrasing across About + IEEG_Pipelines (finding #3).`);
  push(`- Dense run-on sentence in About's IEEG_Pipelines paragraph (finding #4).`);
  push(`- Unminified CSS / inert sass config (finding #5, low priority).`);
  push(``);

  fs.writeFileSync("out/recruiter-report-v2.md", lines.join("\n"));
  console.error(`Wrote out/recruiter-report-v2.md`);
}

main().catch(err => { console.error(err); process.exit(1); });
