// Crawls every page in pages.json against BASE_URL, extracts every
// <a href>/<img src>/<source srcset>/<link href> target, and checks it
// resolves. Internal links are checked against BASE_URL; external links are
// checked against the real internet (skip with --no-external for speed).
import fs from "node:fs";

const BASE = process.env.BASE_URL || "https://aaronearlerichardson.github.io";
const CHECK_EXTERNAL = !process.argv.includes("--no-external");
const pages = JSON.parse(fs.readFileSync("pages.json", "utf8"));

// Sites that reliably block headless/curl requests (anti-bot) regardless of
// whether the link is real — verified manually once, then skipped here so
// they don't cry wolf on every run.
const ANTI_BOT_DOMAINS = ["linkedin.com"];

function extractLinks(html) {
  const links = new Set();
  // <link> tags whose rel is a connection hint, not a fetchable document —
  // preconnect/dns-prefetch to a bare origin 404s by design, not a break.
  const linkTagRe = /<link\b([^>]*)>/gi;
  let lm;
  while ((lm = linkTagRe.exec(html))) {
    const tag = lm[1];
    const relMatch = /\brel="([^"]+)"/i.exec(tag);
    const hrefMatch = /\bhref="([^"]+)"/i.exec(tag);
    if (!hrefMatch) continue;
    const rel = (relMatch && relMatch[1]) || "";
    if (/preconnect|dns-prefetch/i.test(rel)) continue;
    links.add(hrefMatch[1]);
  }
  const patterns = [
    /<a\b[^>]*\bhref="([^"]+)"/gi,
    /<img\b[^>]*\bsrc="([^"]+)"/gi,
    /<source\b[^>]*\bsrcset="([^"]+)"/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html))) {
      const raw = m[1];
      if (raw.startsWith("mailto:") || raw.startsWith("javascript:") || raw.startsWith("#")) continue;
      links.add(raw);
    }
  }
  return [...links].filter(l => !ANTI_BOT_DOMAINS.some(d => l.includes(d)));
}

async function checkUrl(url) {
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: "GET", redirect: "follow" });
    }
    return res.status;
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

async function main() {
  const results = [];
  const checkedExternal = new Map();

  for (const p of pages) {
    const url = BASE + p.path;
    const res = await fetch(url);
    const html = await res.text();
    const links = extractLinks(html, url);

    for (const link of links) {
      const isExternal = /^https?:\/\//.test(link) && !link.startsWith(BASE);
      const isInternal = link.startsWith("/") || link.startsWith(BASE);
      const absolute = isInternal
        ? (link.startsWith("http") ? link : BASE + link)
        : link;

      if (isExternal && !CHECK_EXTERNAL) continue;
      if (isExternal && checkedExternal.has(absolute)) {
        const cached = checkedExternal.get(absolute);
        if (cached >= 400 || typeof cached === "string") {
          results.push({ page: p.path, link, status: cached, external: true, cached: true });
        }
        continue;
      }

      const status = await checkUrl(absolute);
      if (isExternal) checkedExternal.set(absolute, status);
      if (status >= 400 || typeof status === "string") {
        results.push({ page: p.path, link, status, external: isExternal });
      }
    }
  }

  const broken = results;
  console.error(`Checked all pages. ${broken.length} broken link(s) found.`);
  for (const b of broken) {
    console.error(`  [${b.status}] ${b.page} -> ${b.link}${b.external ? " (external)" : ""}`);
  }
  fs.mkdirSync(process.env.BASE_URL ? "out-local" : "out", { recursive: true });
  fs.writeFileSync(
    (process.env.BASE_URL ? "out-local" : "out") + "/link-check.json",
    JSON.stringify({ checkedAt: new Date().toISOString(), base: BASE, broken }, null, 2)
  );
}

main().catch(err => { console.error(err); process.exit(1); });
