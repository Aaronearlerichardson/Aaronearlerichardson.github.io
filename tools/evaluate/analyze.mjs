// ATS-style keyword coverage: real target JDs (fetched via the Jobs
// crawler's own fetchers, or a headless render for JS-only boards) vs the
// live site's actual rendered text. No invented gaps — every hit/miss below
// is a literal substring/regex match against fetched text, with citations.
import fs from "node:fs";

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// Only postings for technical/engineering roles Aaron would actually apply
// to — excludes sales, finance, legal, workplace-ops, market-access, and
// pure clinical-ops roles pulled in by the same company boards.
const RELEVANT_TITLES = new Set([
  "Algorithm Engineer",
  "Senior Algorithm Engineer",
  "Forward Deployed Engineer",
  "Software Engineer III",
  "Systems Engineer",
  "Hardware Test Engineer III",
  "Senior Director, Reliability and Security Engineering",
  "Research Engineer",
  "Embedded Software & Test Engineer",
  "Network Engineer",
  "AI & Data Systems Engineer (Remote)",
  "Director, Data Engineering & Architecture (Remote)",
  "Director, Systems Engineering (Hybrid)",
  "Senior Electrical Engineer",
  "Senior/Staff Firmware Engineer",
  "Staff Supplier Industrialization Engineer",
  "Full-Stack Software Engineer",
  "Senior Mechanical Engineer",
  "Equipment Engineering Manager",
  "PCB Layout Engineer",
  "EE Systems Engineer",
]);

// Non-intern, engineering-relevant Neuralink roles — pulled read-only from
// out/jds.json (a prior session's fetch via Neuralink's public greenhouse
// board; Beacon/Ceribell in that file are superseded by our own fetch below,
// but its Neuralink haul is real and adds a fourth recognizable BCI employer
// our named-target fetch didn't cover).
const NEURALINK_RELEVANT_TITLES = new Set([
  "Machine Learning Engineer",
  "Signal Processing Engineer",
  "Software Engineer, BCI Applications",
  "Software Engineer, CI/CD",
  "Software Engineer, Implant",
  "Software Engineer, Next Gen",
  "Regulatory Engineer",
  "Quality Systems Engineer",
  "Software Design Control Engineer",
  "Electrical Engineer, Implant Embedded Systems",
  "Electrical Engineer, Compute Architecture",
  "Embedded Software Engineer, Implant Embedded Systems",
  "Firmware Engineer, Robotics and Surgery Engineering",
  "Network and Systems Engineer",
  "Neuroengineer, Next Gen",
]);

const rawJobs = JSON.parse(fs.readFileSync("out/target_jds.json", "utf8"));
const kulaJobs = JSON.parse(fs.readFileSync("out/precision-neuroscience-jobs.json", "utf8"));
let neuralinkJobs = [];
try {
  const altFetch = JSON.parse(fs.readFileSync("out/jds.json", "utf8"));
  neuralinkJobs = (altFetch.jobs || []).filter(
    j => j.company === "Neuralink" && NEURALINK_RELEVANT_TITLES.has(j.title)
  );
} catch {
  // out/jds.json is optional read-only input from a prior session; fine if absent.
}

const postings = [
  ...rawJobs.map(j => ({
    company: j.company,
    title: j.title,
    url: j.url,
    text: stripHtml(j.description || ""),
  })),
  ...kulaJobs.map(j => ({
    company: j.company,
    title: j.title.replace(/\s*-\s*Precision Neuroscience$/, ""),
    url: j.url,
    text: j.description || "",
  })),
  ...neuralinkJobs.map(j => ({
    company: "Neuralink",
    title: j.title,
    url: j.url,
    text: j.text || "",
  })),
].filter(p => {
  if (p.company === "Neuralink") return true; // already filtered above
  const bareTitle = p.title.replace(/\s*\(.*?\)\s*$/, "").trim();
  return RELEVANT_TITLES.has(p.title) || RELEVANT_TITLES.has(bareTitle);
});

const siteText = JSON.parse(fs.readFileSync("out/site-text.json", "utf8"));

// Grounded in the actual text read from these postings and the site's own
// About page / project stack front matter — not a generic buzzword list.
const KEYWORDS = [
  ["Docker / containerization", [/\bdocker(ization)?\b/i, /\bcontaineriz/i]],
  ["Kubernetes", [/\bkubernetes\b/i, /\bk8s\b/i]],
  ["Rust", [/\brust\b/i]],
  ["Go (language)", [/\bGo(lang)?\b/]],
  ["RTOS / bare metal", [/\brtos\b/i, /\bbare[- ]metal\b/i]],
  ["Embedded systems / firmware", [/\bembedded (systems|software)\b/i, /\bfirmware\b/i]],
  ["JTAG / hardware debugging", [/\bjtag\b/i]],
  ["Yocto / Buildroot", [/\byocto\b/i, /\bbuildroot\b/i]],
  ["Real-time systems", [/\breal-time\b/i]],
  ["Low-latency systems", [/\blow-latency\b/i, /\blow latency\b/i]],
  ["REST / APIs", [/\bapis?\b/i]],
  ["Backend systems", [/\bbackend\b/i, /\bback-end\b/i]],
  ["Event-driven pipelines / data infrastructure", [/\bevent-driven\b/i, /\bdata infrastructure\b/i, /\bdata pipeline/i]],
  ["CI/CD", [/\bci\/cd\b/i, /\bcontinuous integration\b/i]],
  ["Unit testing / code review culture", [/\bunit test/i, /\bcode review/i, /\bintegration test/i]],
  ["Version control", [/\bversion control\b/i, /\bgit\b/i]],
  ["Cloud (AWS/GCP/Azure)", [/\baws\b/i, /\bgcp\b/i, /\bazure\b/i, /\bcloud-native\b/i]],
  ["DevOps / infrastructure / monitoring", [/\bdevops\b/i, /\binfrastructure\b/i, /\bmonitoring\b/i, /\bincident response\b/i]],
  ["Machine learning / deep learning", [/\bmachine learning\b/i, /\bdeep learning\b/i]],
  ["PyTorch", [/\bpytorch\b/i]],
  ["Transformers / large model training", [/\btransformer/i, /\bvit\b/i, /\blarge (scale|model) (modeling|training)\b/i]],
  ["Signal processing / DSP", [/\bsignal processing\b/i, /\bdsp\b/i, /\bdigital signal\b/i]],
  ["Biosignals / EEG", [/\bbiosignal/i, /\beeg\b/i]],
  ["Time-series data", [/\btime.series\b/i]],
  ["Statistics", [/\bstatistic/i]],
  ["Medical device / Class II device", [/\bmedical device/i, /\bclass ii\b/i]],
  ["FDA / 510(k)", [/\bfda\b/i, /510\(?k\)?/i]],
  ["Quality management system (QMS)", [/\bqms\b/i, /\bquality management system\b/i]],
  ["Risk management (ISO 14971)", [/\brisk management\b/i, /\biso 14971\b/i]],
  ["Design controls", [/\bdesign control/i]],
  ["Verification & validation", [/\bverification and validation\b/i, /\bv&v\b/i, /\bsystem verification\b/i]],
  ["Traceability", [/\btraceability\b/i]],
  ["Design for manufacturability (DFM/DFA)", [/\bdfm\b/i, /\bdfa\b/i, /\bdesign for manufactur/i]],
  ["PCB / schematics / datasheets", [/\bpcb\b/i, /\bcircuit schematic/i, /\bdatasheet/i]],
  ["Electrical engineering", [/\belectrical engineer/i]],
  ["Mechanical design / CAD", [/\bcad\b/i, /\bsolidworks\b/i, /\bfusion 360\b/i]],
  ["Microfabrication", [/\bmicrofabrication\b/i]],
  ["Clinical studies / clinical trials", [/\bclinical (trial|stud)/i]],
  ["Cross-functional collaboration", [/\bcross-functional\b/i]],
  ["Frontend / UX", [/\bfront-?end\b/i, /\breact\b/i, /\bUX\b/]],
  ["SQL / databases", [/\bsql\b/i, /\bdatabase/i]],
  ["Regulatory affairs", [/\bregulatory\b/i]],
  ["AI tooling / internal AI applications", [/\bai[- ]powered\b/i, /\bai tool/i, /\bllm\b/i]],
];

function matchesAny(text, regexes) {
  return regexes.some(r => r.test(text));
}

const siteHitsByKeyword = new Map();
for (const [label, regexes] of KEYWORDS) {
  const hits = siteText.filter(p => matchesAny(p.text, regexes)).map(p => p.path);
  siteHitsByKeyword.set(label, hits);
}

const jdHitsByKeyword = new Map();
for (const [label, regexes] of KEYWORDS) {
  const hits = postings.filter(p => matchesAny(p.text, regexes));
  jdHitsByKeyword.set(label, hits);
}

const gaps = [];
const covered = [];
for (const [label] of KEYWORDS) {
  const jdHits = jdHitsByKeyword.get(label);
  const siteHits = siteHitsByKeyword.get(label);
  if (jdHits.length > 0 && siteHits.length === 0) {
    gaps.push({
      keyword: label,
      postingCount: jdHits.length,
      sources: jdHits.map(h => ({ company: h.company, title: h.title, url: h.url })),
    });
  } else if (jdHits.length > 0 && siteHits.length > 0) {
    covered.push({ keyword: label, postingCount: jdHits.length, sitePages: siteHits });
  }
}
gaps.sort((a, b) => b.postingCount - a.postingCount);

// Site-only: real technical terms drawn from front-matter `stack` + About
// page, checked against whether ANY relevant posting ever uses them.
const SITE_TERMS = [
  ["MATLAB", [/\bmatlab\b/i]],
  ["Nipype", [/\bnipype\b/i]],
  ["BIDS (neuroimaging standard)", [/\bbids\b/i]],
  ["NWB / DANDI", [/\bnwb\b/i, /\bdandi\b/i]],
  ["Cython", [/\bcython\b/i]],
  ["CUDA", [/\bcuda\b/i]],
  ["sliceTCA (Aaron's own method)", [/\bslicetca\b/i]],
  ["MNE-Python", [/\bmne\b/i]],
  ["scikit-learn", [/\bscikit/i]],
  ["Fusion 360", [/\bfusion 360\b/i]],
  ["Nuitka", [/\bnuitka\b/i]],
  ["Pygame", [/\bpygame\b/i]],
  ["Claude API / LLM agents", [/\bclaude api\b/i]],
];
const siteOnly = [];
for (const [label, regexes] of SITE_TERMS) {
  const onSite = siteText.filter(p => matchesAny(p.text, regexes)).map(p => p.path);
  const inJDs = postings.filter(p => matchesAny(p.text, regexes));
  if (onSite.length > 0 && inJDs.length === 0) {
    siteOnly.push({ keyword: label, sitePages: onSite });
  }
}

const output = {
  postingsAnalyzed: postings.map(p => ({ company: p.company, title: p.title, url: p.url, chars: p.text.length })),
  gaps,
  covered,
  siteOnly,
};

fs.mkdirSync("out", { recursive: true });
fs.writeFileSync("out/keyword-coverage.json", JSON.stringify(output, null, 2));
console.error(`Analyzed ${postings.length} relevant postings across ${new Set(postings.map(p => p.company)).size} companies.`);
console.error(`Gaps: ${gaps.length}, Covered: ${covered.length}, Site-only: ${siteOnly.length}`);
console.error(`Wrote out/keyword-coverage.json`);
