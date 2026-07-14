// Pulls the real rendered text of every live page (via the same Chrome
// instance used for the audit) into one JSON file for keyword analysis.
import fs from "node:fs";
import * as chromeLauncher from "chrome-launcher";
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE_URL || "https://aaronearlerichardson.github.io";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const pages = JSON.parse(fs.readFileSync("pages.json", "utf8"));
const OUT_PATH = process.env.BASE_URL ? "out-local/site-text.json" : "out/site-text.json";
fs.mkdirSync(process.env.BASE_URL ? "out-local" : "out", { recursive: true });

async function main() {
  const chrome = await chromeLauncher.launch({
    chromePath: CHROME_PATH,
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });
  const browser = await puppeteer.connect({ browserURL: `http://localhost:${chrome.port}` });
  const page = await browser.newPage();

  const results = [];
  for (const p of pages) {
    const url = BASE + p.path;
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    const text = await page.evaluate(() => document.body.innerText);
    results.push({ path: p.path, label: p.label, text });
    console.error(`${p.path}: ${text.length} chars`);
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
  console.error(`Wrote ${OUT_PATH}`);

  await browser.disconnect();
  try { await chrome.kill(); } catch {}
}

main().catch(err => { console.error(err); process.exit(1); });
