// Renders og-image.html at the standard 1200x630 OG-card size via headless
// Chrome and screenshots it to assets/images/og-card.png. Original artwork
// (a hand-drawn signal/electrode motif) — not a paper figure.
import * as chromeLauncher from "chrome-launcher";
import puppeteer from "puppeteer-core";
import path from "node:path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const HTML_PATH = path.join(process.cwd(), "og-image.html");
const OUT_PATH = "C:\\Users\\Jakda\\git\\Aaronearlerichardson.github.io\\assets\\images\\og-card.png";

async function main() {
  const chrome = await chromeLauncher.launch({
    chromePath: CHROME_PATH,
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });
  const browser = await puppeteer.connect({ browserURL: `http://localhost:${chrome.port}` });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
  await page.goto(`file:///${HTML_PATH.replace(/\\/g, "/")}`, { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 300)); // let webfonts settle
  await page.screenshot({ path: OUT_PATH, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.error(`Wrote ${OUT_PATH}`);
  await browser.disconnect();
  try { await chrome.kill(); } catch {}
}

main().catch(err => { console.error(err); process.exit(1); });
