import fs from "node:fs";

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#8217;/g, "'").replace(/\s+/g, " ").trim();
}

const RELEVANT_TITLES = new Set([
  "Algorithm Engineer", "Senior Algorithm Engineer", "Forward Deployed Engineer",
  "Software Engineer III", "Systems Engineer", "Hardware Test Engineer III",
  "Senior Director, Reliability and Security Engineering", "Research Engineer",
  "Embedded Software & Test Engineer", "Network Engineer",
  "AI & Data Systems Engineer (Remote)", "Director, Data Engineering & Architecture (Remote)",
  "Director, Systems Engineering (Hybrid)", "Senior Electrical Engineer",
  "Senior/Staff Firmware Engineer", "Staff Supplier Industrialization Engineer",
  "Full-Stack Software Engineer", "Senior Mechanical Engineer", "Equipment Engineering Manager",
  "PCB Layout Engineer", "EE Systems Engineer",
]);
const NEURALINK_RELEVANT_TITLES = new Set([
  "Machine Learning Engineer", "Signal Processing Engineer", "Software Engineer, BCI Applications",
  "Software Engineer, CI/CD", "Software Engineer, Implant", "Software Engineer, Next Gen",
  "Regulatory Engineer", "Quality Systems Engineer", "Software Design Control Engineer",
  "Electrical Engineer, Implant Embedded Systems", "Electrical Engineer, Compute Architecture",
  "Embedded Software Engineer, Implant Embedded Systems", "Firmware Engineer, Robotics and Surgery Engineering",
  "Network and Systems Engineer", "Neuroengineer, Next Gen",
]);

const rawJobs = JSON.parse(fs.readFileSync("out/target_jds.json", "utf8"));
const kulaJobs = JSON.parse(fs.readFileSync("out/precision-neuroscience-jobs.json", "utf8"));
let neuralinkJobs = [];
try {
  const altFetch = JSON.parse(fs.readFileSync("out/jds.json", "utf8"));
  neuralinkJobs = (altFetch.jobs || []).filter(j => j.company === "Neuralink" && NEURALINK_RELEVANT_TITLES.has(j.title));
} catch {}

const postings = [
  ...rawJobs.map(j => ({ company: j.company, title: j.title, url: j.url, text: stripHtml(j.description || "") })),
  ...kulaJobs.map(j => ({ company: j.company, title: j.title.replace(/\s*-\s*Precision Neuroscience$/, ""), url: j.url, text: j.description || "" })),
  ...neuralinkJobs.map(j => ({ company: "Neuralink", title: j.title, url: j.url, text: j.text || "" })),
].filter(p => {
  if (p.company === "Neuralink") return true;
  const bareTitle = p.title.replace(/\s*\(.*?\)\s*$/, "").trim();
  return RELEVANT_TITLES.has(p.title) || RELEVANT_TITLES.has(bareTitle);
});

const linkedinText = fs.readFileSync("out/linkedin-source.txt", "utf8");

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

function matchesAny(text, regexes) { return regexes.some(r => r.test(text)); }

const jdHitsByKeyword = new Map();
for (const [label, regexes] of KEYWORDS) {
  jdHitsByKeyword.set(label, postings.filter(p => matchesAny(p.text, regexes)));
}

const gaps = [], covered = [];
for (const [label] of KEYWORDS) {
  const jdHits = jdHitsByKeyword.get(label);
  const onLinkedin = KEYWORDS.find(k => k[0] === label)[1].some(r => r.test(linkedinText));
  if (jdHits.length > 0 && !onLinkedin) {
    gaps.push({ keyword: label, postingCount: jdHits.length, sources: jdHits.map(h => ({ company: h.company, title: h.title, url: h.url })) });
  } else if (jdHits.length > 0 && onLinkedin) {
    covered.push({ keyword: label, postingCount: jdHits.length });
  }
}
gaps.sort((a, b) => b.postingCount - a.postingCount);

const output = { postingsAnalyzed: postings.map(p => ({ company: p.company, title: p.title, url: p.url })), gaps, covered };
fs.writeFileSync("out/linkedin-keyword-coverage.json", JSON.stringify(output, null, 2));
console.error(`LinkedIn analyzed against ${postings.length} postings. Gaps: ${gaps.length}, Covered: ${covered.length}`);
