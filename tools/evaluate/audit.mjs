// Technical audit: Lighthouse (perf/a11y/best-practices/SEO) + axe-core,
// run for real against the live site. No invented numbers — everything in
// out/audit.json comes straight out of these two tools.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";
import puppeteer from "puppeteer-core";
import axeSource from "axe-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// BASE_URL env var lets this run against a local `jekyll serve` build for
// pre-deploy verification; defaults to the live production site.
const BASE = process.env.BASE_URL || "https://aaronearlerichardson.github.io";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT_DIR = path.join(__dirname, process.env.BASE_URL ? "out-local" : "out");
const LHR_DIR = path.join(OUT_DIR, "lighthouse");
fs.mkdirSync(LHR_DIR, { recursive: true });

const pages = JSON.parse(fs.readFileSync(path.join(__dirname, "pages.json"), "utf8"));

async function runLighthouse(url, port) {
  const result = await lighthouse(url, {
    port,
    output: "json",
    logLevel: "error",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    formFactor: "desktop",
    screenEmulation: { disabled: true },
    throttlingMethod: "simulate",
  });
  return result.lhr;
}

async function runAxe(browser, url) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
  await page.evaluate(axeSource.source);
  const results = await page.evaluate(async () => {
    return await window.axe.run(document, {
      resultTypes: ["violations"],
    });
  });
  await page.close();
  return results;
}

async function main() {
  const chrome = await chromeLauncher.launch({
    chromePath: CHROME_PATH,
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });
  console.error(`Chrome launched on port ${chrome.port}`);

  const browser = await puppeteer.connect({
    browserURL: `http://localhost:${chrome.port}`,
  });

  const results = [];

  for (const p of pages) {
    const url = BASE + p.path;
    process.stderr.write(`Auditing ${url} ... `);
    try {
      const lhr = await runLighthouse(url, chrome.port);
      const slug = p.path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home";
      fs.writeFileSync(path.join(LHR_DIR, `${slug}.json`), JSON.stringify(lhr, null, 2));

      const axeResults = await runAxe(browser, url);

      const categories = {};
      for (const [key, cat] of Object.entries(lhr.categories)) {
        categories[key] = cat.score === null ? null : Math.round(cat.score * 100);
      }

      const audits = lhr.audits;
      const failedAudits = Object.values(audits)
        .filter(a => a.score !== null && a.score < 1 && a.scoreDisplayMode !== "notApplicable" && a.scoreDisplayMode !== "informative")
        .map(a => ({ id: a.id, title: a.title, score: a.score, displayValue: a.displayValue || null }));

      results.push({
        path: p.path,
        label: p.label,
        url,
        lighthouse: {
          categories,
          failedAudits,
        },
        axe: {
          violationCount: axeResults.violations.length,
          violations: axeResults.violations.map(v => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            help: v.help,
            helpUrl: v.helpUrl,
            nodeCount: v.nodes.length,
            targets: v.nodes.slice(0, 5).map(n => n.target.join(" ")),
          })),
        },
      });
      console.error(`perf=${categories.performance} a11y=${categories.accessibility} bp=${categories["best-practices"]} seo=${categories.seo} axe-violations=${axeResults.violations.length}`);
    } catch (err) {
      console.error(`FAILED: ${err.message}`);
      results.push({ path: p.path, label: p.label, url, error: err.message });
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, "audit.json"), JSON.stringify(results, null, 2));
  console.error(`\nWrote ${path.join(OUT_DIR, "audit.json")}`);

  await browser.disconnect();
  try {
    await chrome.kill();
  } catch (err) {
    // chrome-launcher's temp-profile cleanup can EPERM on Windows if the
    // process hasn't fully released its lock yet; the audit output above
    // is already written, so this is harmless.
    console.error(`(non-fatal) chrome cleanup: ${err.message}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
