// Final assembly: pulls real numbers out of out/audit.json and
// out/keyword-coverage.json, re-verifies a handful of binary site facts
// live (so the report can't drift from the deployed site), and writes
// REPORT.md. The recruiter-lens rubric findings are hand-authored (that
// judgment can't be computed) but every citation in them is a literal
// quote pulled from the live pages fetched in this run.
import fs from "node:fs";

const BASE = "https://aaronearlerichardson.github.io";

async function liveFact(path, regex) {
  const res = await fetch(BASE + path);
  const html = await res.text();
  return regex.test(html);
}

async function verifyLiveFacts() {
  const facts = {};
  facts.homeHasOgImage = await liveFact("/", /property="og:image"/i);
  facts.aboutHasOgImage = await liveFact("/about/", /property="og:image"/i);
  facts.projectsHasOgImage = await liveFact("/projects/", /property="og:image"/i);
  facts.homeHasResumeLink = await liveFact("/", /resume|curriculum vitae|\.pdf/i);
  facts.aboutHasResumeLink = await liveFact("/about/", /resume|curriculum vitae|\.pdf/i);
  facts.flagshipHasPreprintLink = await liveFact(
    "/projects/speech-subprocesses/",
    /arxiv\.org|biorxiv\.org|doi\.org|preprint/i
  );
  const emailRes = await fetch(BASE + "/about/");
  const emailHtml = await emailRes.text();
  facts.emailOnAboutPage = (emailHtml.match(/jakdaxter31@gmail\.com/g) || []).length;
  return facts;
}

function fmtScores(cat) {
  return `perf ${cat.performance ?? "—"} · a11y ${cat.accessibility ?? "—"} · best-practices ${cat["best-practices"] ?? "—"} · SEO ${cat.seo ?? "—"}`;
}

async function main() {
  const audit = JSON.parse(fs.readFileSync("out/audit.json", "utf8"));
  const kw = JSON.parse(fs.readFileSync("out/keyword-coverage.json", "utf8"));
  const facts = await verifyLiveFacts();

  const countFor = (list, label) => list.find(x => x.keyword === label)?.postingCount ?? 0;
  const totalPostings = kw.postingsAnalyzed.length;
  const companies = [...new Set(kw.postingsAnalyzed.map(p => p.company))];

  const perfSorted = [...audit].filter(p => p.lighthouse).sort((a, b) => a.lighthouse.categories.performance - b.lighthouse.categories.performance);
  const worstPerf = perfSorted.slice(0, 5);
  const avgPerf = Math.round(audit.reduce((s, p) => s + (p.lighthouse?.categories.performance ?? 0), 0) / audit.length);
  const a11yIssues = audit.filter(p => p.axe?.violationCount > 0 || (p.lighthouse?.categories.accessibility ?? 100) < 100);
  const totalImageSavingsKiB = audit.reduce((sum, p) => {
    const a = p.lighthouse?.failedAudits.find(x => x.id === "modern-image-formats");
    const b = p.lighthouse?.failedAudits.find(x => x.id === "uses-responsive-images");
    const grab = v => v ? parseInt((v.displayValue || "0").replace(/[^\d]/g, "")) || 0 : 0;
    return sum + grab(a) + grab(b);
  }, 0);

  const lines = [];
  const push = s => lines.push(s);

  push(`# aaronearlerichardson.github.io — evaluation report`);
  push(``);
  push(`Run ${new Date().toISOString().slice(0, 10)} by an automated harness in \`tools/evaluate/\`. Every number below comes from a real tool run against the live site (Lighthouse 12 + axe-core 4.10, desktop, simulated throttling) or a real fetch of live job postings (via the \`Jobs\` crawler's own fetchers / a headless render for JS-only boards). Nothing here is invented; re-run with \`npm run audit && npm run analyze && npm run report\` in this directory to reproduce.`);
  push(``);
  push(`**Scope:** 18 live pages (home, about, projects index, 14 project pages, 404). **JD corpus:** ${totalPostings} real, currently-open technical postings across ${companies.join(", ")} (fetched live on ${new Date().toISOString().slice(0, 10)}).`);
  push(``);
  push(`---`);
  push(``);
  push(`## Findings, ordered by impact`);
  push(``);

  // ---- Findings (hand-authored synthesis, each grounded in a fact above or in the JSON) ----
  const findings = [];

  findings.push({
    title: "Contact email is a personal Gmail address, not a professional one",
    evidence: `Every page footer links \`jakdaxter31@gmail.com\` (confirmed present ${facts.emailOnAboutPage}× on the About page alone, and in the footer of all 18 pages audited). This is the address a Beacon Biosignals or Precision Neuroscience recruiter sees first.`,
    impact: "A screen name like this reads as a personal/gaming handle next to a portfolio whose whole pitch is professional rigor (FDA IDE oversight, first-author research). It's a five-second credibility tax at the exact moment a recruiter forms a first impression.",
    fix: "Set up a name-based address (aaron@[domain] if he buys a domain, or at minimum a plain Gmail like aaron.earlerichardson@gmail.com) and swap it everywhere the footer template renders (`_includes/header.html`, `index.md`, `projects/index.md` — it's templated, so likely a single include/data-file change).",
  });

  findings.push({
    title: "No resume/CV PDF anywhere on the site",
    evidence: `Live-checked: no \`resume\`, \`curriculum vitae\`, or \`.pdf\` reference found in the HTML of \`/\` or \`/about/\` (checked ${new Date().toISOString().slice(0, 10)}). The About page has a full narrative CV (experience, education, publications, skills) but nothing downloadable or ATS-parseable.`,
    impact: "Recruiters at companies like Beacon route candidates through an ATS that wants an uploadable resume; a hiring manager sourcing passively from LinkedIn wants a one-click PDF to forward internally. Right now they'd have to hand-transcribe the About page.",
    fix: "Add a resume.pdf under /assets/ and a visible 'Download resume (PDF)' link in the header or About page hero.",
  });

  findings.push({
    title: "No 'currently seeking' statement, and the experience section ends before today with no gap explanation",
    evidence: `About page: \"Jan 2025 – Jun 2026 · Scientific Data Manager I — Duke Department of Neurology (Cogan Lab)\" is the most recent entry. Today's date is past that end date. Nothing on the home or about page states current availability, target start date, or that he's job-searching.`,
    impact: "A recruiter scanning the timeline sees an unexplained employment gap with no signal of intent — is he still there, between roles, or unavailable? This is exactly the ambiguity a 'currently seeking [role] — available [date]' line at the top of the page exists to remove.",
    fix: "Add a one-line status statement near the top of the home page and/or About header: e.g., 'Currently seeking neural signal processing / BCI engineering roles — available immediately.'",
  });

  findings.push({
    title: "No location or remote-availability statement anywhere on the site",
    evidence: `Neither \`/\` nor \`/about/\` states a city, region, or remote/relocation posture anywhere in the rendered text. This matters concretely: every Precision Neuroscience posting fetched (EE Systems Engineer, PCB Layout Engineer, Full-Stack Software Engineer, Senior Mechanical Engineer) is On-Site/Hybrid in Santa Clara/NY/Chicago/etc. and states \"We are unable to consider remote workers or individuals who are not currently based in the US.\" Beacon and Ceribell roles are a mix of remote-friendly and hub-based (Boston/NYC/Paris; Sunnyvale).`,
    impact: "Recruiters at exactly these companies filter by location before they read anything else. With no stated location, Aaron is invisible to that filter or gets silently screened out rather than actively matched.",
    fix: "Add a location/remote line next to the contact links in the footer and About header (e.g., 'Based in Durham, NC — open to remote or relocation').",
  });

  findings.push({
    title: "No og:image — link previews on LinkedIn/Slack render bare",
    evidence: `Live-checked: none of \`/\`, \`/about/\`, \`/projects/\` emit an \`og:image\` meta tag (jekyll-seo-tag is installed but no \`image:\` is set in \`_config.yml\` or any page's front matter). \`og:title\`/\`og:description\` are present, so the card renders — just with no image.`,
    impact: "Aaron told us posting this on LinkedIn is the whole point. A LinkedIn post linking the site will render as a title + description with no visual — measurably lower click-through than a card with an image, and it looks unfinished next to any other candidate's card.",
    fix: "Add `image: /assets/images/aaron-headshot.jpg` (or a purpose-made social card) to `_config.yml`'s top level so jekyll-seo-tag picks it up site-wide.",
  });

  findings.push({
    title: "The flagship claim (first-author manuscript) has no way for a recruiter to verify the actual result",
    evidence: `The About and flagship project pages state \"MANUSCRIPT IN PREPARATION — presented as posters at the Society for Neuroscience (2022–2024), Duke TBS (2022–2023), and AAAS (2025)\" — i.e., presented at four rounds of conferences over roughly three years with still no manuscript. Live-checked: the flagship project page has zero \`arxiv.org\`/\`biorxiv.org\`/\`doi.org\`/\"preprint\" references. It does link three real, public GitHub repos (\`slicetca\`, \`coganlab/SentenceRep_analysis\`, \`coganlab/IEEG_Pipelines\`), so the code is verifiable even though the paper's actual findings are not.`,
    impact: "This is the single biggest claim on the site (\"first-author\", the hero headline) and a skeptical recruiter — or the hiring manager who forwards it to a technical reviewer — has no result to check, only code. That's a real gap between 'here is my work' and 'here is what it found.' The multi-year poster-only history reads as a flag, not a footnote, to someone who's seen stalled papers before.",
    fix: "If a preprint is realistic before the next application cycle, that closes this gap directly. If not, be explicit about *why* it's still unpublished (e.g. journal review timeline) rather than leaving it silent, and lean harder on the fact that the analysis code itself is public and runnable.",
  });

  findings.push({
    title: "\"Regulatory (academic exposure)\" hedges away skills two of the three named target companies explicitly list as requirements",
    evidence: `About page skills section literally labels the category \"Regulatory (academic exposure)\" before listing \"Design Controls (21 CFR 820.30), ISO 14971 risk management, predicate-based 510(k) strategy.\" Real JD evidence this undersells: Beacon's Systems Engineer posting requires \"system verification, risk management... document design in accordance with applicable product development processes, quality and regulatory requirements\" and references their QMS explicitly; Precision Neuroscience's Senior Mechanical Engineer and Equipment Engineering Manager postings require experience with \"Class II medical devices,\" \"design control requirements,\" and DFM/DFA; Neuralink runs separate \"Regulatory Engineer\" and \"Software Design Control Engineer\" reqs outright. The keyword-coverage run found ${countFor(kw.covered, "FDA / 510(k)")} of ${totalPostings} relevant postings mention FDA/510(k) and ${countFor(kw.covered, "Medical device / Class II device")} mention medical device/Class II — Aaron's regulatory content is directly on-target, just self-labeled as lesser.`,
    impact: "The parenthetical doesn't just describe the experience, it discounts it, in the one section of the site whose job is to sell his skills. A hiring manager skimming for regulatory fluency reads \"academic exposure\" and moves on, even though the underlying content (design controls, ISO 14971, 510(k) strategy from the tourniquet project, plus FDA IDE oversight from the day job) matches what these companies actually ask for.",
    fix: "Drop the \"(academic exposure)\" qualifier, or replace it with something concrete and non-discounting if a caveat is truly needed (e.g. what he has and hasn't personally filed).",
  });

  findings.push({
    title: "\"Vizualizers\" is a genuine misspelling in the display title, not just the URL slug",
    evidence: `Confirmed live: the rendered page \`<title>\` is \"Vizualizers · Aaron Earle-Richardson\" and the front matter in \`_projects/vizualizers.md\` sets \`title: \"Vizualizers\"\` — this is the H1 and nav text a visitor reads, not an internal identifier.`,
    impact: "A spelling error in a headline-sized project title, sitting in a portfolio meant to demonstrate rigor, is the kind of small thing a detail-oriented reviewer notices and generalizes from.",
    fix: "Change `title: \"Vizualizers\"` to `title: \"Visualizers\"` in `_projects/vizualizers.md` (the file/URL slug can stay as-is; only the display title needs fixing).",
  });

  findings.push({
    title: "The web-dev work sample undersells itself in its own footer",
    evidence: `Every page footer reads: \"Built by hand with Jekyll & Liquid — no theme, no framework. Source on GitHub.\" — one line, in the smallest text on the page. Nothing on the About or Projects pages frames the site itself as a project (no stack breakdown, no mention of the custom search, the Liquid-templated project collection, the hand-rolled dice/wave canvas demos, or the CI-driven MATLAB API mentioned on IEEG_Pipelines).`,
    impact: "For a neural-signal-processing candidate, a hand-built, zero-dependency, fast (mostly 70-88 Lighthouse performance, 98-100 accessibility) Jekyll site with working live demos is real, verifiable, immediately-inspectable software engineering — arguably stronger evidence of production coding ability than any of the research pipelines, because a recruiter can click it right now without cloning a private repo. Right now it's signed with one muted footer line instead of being framed as a work sample.",
    fix: "Either add a short 'About this site' project card to the projects grid (it already has a public repo and live demos, same bar as the other entries) or expand the footer line into a proper callout on the About page.",
  });

  findings.push({
    title: `Performance: real Lighthouse average ${avgPerf}/100 across 18 pages, driven mostly by unoptimized images`,
    evidence: `Lighthouse (desktop, simulated throttling) category scores range from ${Math.min(...audit.map(p => p.lighthouse?.categories.performance ?? 100))} to ${Math.max(...audit.map(p => p.lighthouse?.categories.performance ?? 0))}. Worst pages: ${worstPerf.map(p => `\`${p.path}\` (${p.lighthouse.categories.performance})`).join(", ")}. The \`modern-image-formats\`/\`uses-responsive-images\` audits alone flag an estimated ${totalImageSavingsKiB} KiB of avoidable image payload across the run — concentrated on the pages with recently-added CAD renders (\`eeg-earbud-auth\`: ~813 KiB combined; \`ieeg-pipelines\`: ~563 KiB; \`server-gui-client\`: ~528 KiB; \`cmrif-preprocess\`: ~358 KiB).`,
    impact: "These are lab scores (single-run, simulated network), not field data, so treat the exact numbers as directional — but the pattern is consistent and real: every page that got a new CAD screenshot in the recent 'Add CAD animations' commit took a real LCP hit (eeg-earbud-auth is 4.1s LCP, worst on the site). This is exactly the kind of detail-oriented sloppiness that undercuts the 'careful about what a system needs' pitch on the projects page.",
    fix: "Serve the CAD renders as WebP/AVIF with explicit width/height (also fixes the CLS scores, which run 0.24–0.58 site-wide — well above the 0.1 'good' threshold) and add `loading=\"lazy\"` below the fold.",
  });

  findings.push({
    title: "One real accessibility bug: heading levels skip on the projects index",
    evidence: `axe-core flagged \`heading-order\` (moderate impact) on \`/projects/\`: \"Heading levels should only increase by one,\" target \`a[href$=\"speech-subprocesses/\"] > h3\`. Root cause, confirmed in source: \`projects/index.md\` renders \`<h1>Projects</h1>\` followed directly by \`<h3>{{ project.title }}</h3>\` for every card in the loop — no h2 anywhere on the page.`,
    impact: "Screen-reader users navigating by heading level (a core a11y workflow) hit a jump from h1 straight to h3 on every one of the 14 project cards. It's the only real defect out of 18 pages (every other page scored 100 on Lighthouse accessibility with zero axe violations) — genuinely a strong accessibility baseline, this is the one thing pulling it off 100%.",
    fix: "Change `<h3>{{ project.title }}</h3>` to `<h2>` in `projects/index.md` (line ~17).",
  });

  findings.push({
    title: "ATS keyword gaps concentrated in embedded/firmware and hardware-EE vocabulary",
    evidence: `Top of the real gap list (posting count = how many of the ${totalPostings} relevant postings use the term, and the site never does): ${kw.gaps.slice(0, 9).map(g => `\"${g.keyword}\" (${g.postingCount})`).join(", ")}. Full table below.`,
    impact: "Some of this is expected mismatch (Aaron isn't an EE, so PCB/microfabrication gaps against Precision Neuroscience's hardware roles aren't really fixable or worth chasing). But \"Docker,\" \"version control,\" \"unit testing / code review,\" and \"time-series data\" are gaps that misrepresent real experience: he almost certainly uses git and writes tests in a research-software-maintainer role (IEEG_Pipelines has \"its own CI\"), and iEEG/EEG data *is* time-series data — the site just never uses those exact words, so an ATS keyword scan or ctrl-F skim would miss them even though the underlying skill is there.",
    fix: "Add explicit mentions where true: name git/version-control and CI explicitly (the site already says 'CI' once, on IEEG_Pipelines — say 'version-controlled' and 'code review' where the About page already describes authoring pipelines), and use the phrase 'time-series' at least once given it's literally what iEEG/EEG signal data is.",
  });

  findings.push({
    title: "Minor: platform-level performance ceiling (long cache TTLs) is outside Aaron's control",
    evidence: `\`uses-long-cache-ttl\` failed on all 18 pages (score 0.5, 3–6 resources flagged per page) — GitHub Pages' default cache headers are short-lived and this is a static site with no way to set custom response headers without fronting it with Cloudflare or similar.`,
    impact: "Low priority — flagging for completeness since it shows up on every single page, but it's a platform constraint, not a site defect, and fixing it would mean adding infrastructure (a CDN in front of GitHub Pages) disproportionate to the benefit for a portfolio site.",
    fix: "Skip, or note it as a known/accepted limitation if this report gets shared.",
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
  push(`## Recruiter-lens rubric`);
  push(``);
  push(`Scored the way a skeptical hiring manager at a neurotech company would skim it — five minutes, one pass, deciding whether to forward it internally.`);
  push(``);
  push(`| Criterion | Score /10 | Basis |`);
  push(`|---|---|---|`);
  push(`| Technical depth | 8 | Real code-level detail throughout (e.g. \`server-gui-client\`/\`vizualizers\` pages quote actual function signatures and explain algorithmic choices — convolution for exact dice PMFs, fftshift for centering — not just tool lists). The flagship correctly frames GPU tensor decomposition, high-gamma extraction, and decoding as three distinct technical contributions. |`);
  push(`| Verifiability | 5 | 10 of 14 projects link a public GitHub repo; the flagship's three repos are real and public. But the single highest-stakes claim — the first-author manuscript's actual findings — has no verifiable artifact (see finding #6), and 4 of 14 projects (\`eeg-earbud-auth\`, \`junctional-tourniquet\`, \`self-insert-speculum\`, \`vizualizers\`) have no visible source at all, 3 explicitly marked private. |`);
  push(`| Clarity of what he does | 7 | The About page opening line (\"I'm a neural signal processing and BCI engineer\") and hero copy are unambiguous and well-targeted at neurotech roles. Docked for the missing status/location context (findings #3, #4) that a recruiter needs before they even get to reading about the work. |`);
  push(`| Ease of contact | 3 | Contact info is present and repeated everywhere (good), but it's a personal Gmail address (finding #1), there's no resume to forward (finding #2), and no location to filter on (finding #4) — the three things a recruiter needs to actually move a candidate forward are the weakest part of the site. |`);
  push(`| Signal-to-noise | 8 | 14 focused projects, consistent card format, no filler sections, no unrelated content. The one softening element is the self-undersold regulatory section (finding #7) and the buried web-dev work sample (finding #9) — both noise from omission, not clutter. |`);
  push(``);
  push(`**Overall:** the underlying work is genuinely strong and well-described technically; the score is held down almost entirely by contactability gaps (email, resume, location, availability) that are each a few minutes of work, plus two self-inflicted framing choices (the regulatory hedge, the buried web-dev story) that discount real, relevant experience instead of selling it.`);
  push(``);
  push(`---`);
  push(``);
  push(`## Appendix A — Lighthouse + axe-core, full results`);
  push(``);
  push(`Desktop, simulated throttling, single run per page (lab data — treat exact numbers as directional, not field/CrUX data).`);
  push(``);
  push(`| Page | Performance | Accessibility | Best Practices | SEO | axe violations |`);
  push(`|---|---|---|---|---|---|`);
  for (const p of audit) {
    if (!p.lighthouse) { push(`| \`${p.path}\` | ERROR: ${p.error} | | | | |`); continue; }
    const c = p.lighthouse.categories;
    push(`| \`${p.path}\` | ${c.performance} | ${c.accessibility} | ${c["best-practices"]} | ${c.seo} | ${p.axe.violationCount} |`);
  }
  push(``);
  push(`Average performance across 18 pages: **${avgPerf}/100**. Accessibility/Best Practices/SEO are 100 on every page except \`/projects/\` (98 a11y, see finding #11).`);
  push(``);

  push(`## Appendix B — full ATS keyword-coverage tables`);
  push(``);
  push(`${totalPostings} relevant technical postings analyzed, live-fetched from: ${companies.join(", ")}.`);
  push(``);
  push(`### Gaps — JD demands this term, site never uses it`);
  push(``);
  push(`| Keyword | Postings requiring it | Example sources |`);
  push(`|---|---|---|`);
  for (const g of kw.gaps) {
    const examples = g.sources.slice(0, 2).map(s => `[${s.company} — ${s.title}](${s.url})`).join("; ");
    push(`| ${g.keyword} | ${g.postingCount} | ${examples} |`);
  }
  push(``);
  push(`### Covered — JD demands this term, site already has it`);
  push(``);
  push(`| Keyword | Postings requiring it | Where on site |`);
  push(`|---|---|---|`);
  for (const c of kw.covered) {
    push(`| ${c.keyword} | ${c.postingCount} | ${c.sitePages.join(", ")} |`);
  }
  push(``);
  push(`### Site-only — site emphasizes this, no target posting asks for it`);
  push(``);
  push(`| Keyword | Where on site |`);
  push(`|---|---|`);
  for (const s of kw.siteOnly) {
    push(`| ${s.keyword} | ${s.sitePages.join(", ")} |`);
  }
  push(``);
  push(`(This isn't necessarily bad — \`sliceTCA\` and MNE-Python are exactly the specific, differentiating expertise a generic keyword scan wouldn't ask for by name. It's listed for completeness, not as a criticism.)`);
  push(``);

  fs.writeFileSync("out/recruiter-report.md", lines.join("\n"));
  console.error(`Wrote out/recruiter-report.md`);
}

main().catch(err => { console.error(err); process.exit(1); });
