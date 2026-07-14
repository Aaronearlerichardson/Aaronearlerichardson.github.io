// Saves real screenshot files (not just inline previews) of the live,
// deployed site for the wrap-up deliverable: home in light + dark, the new
// colophon page, and the projects index.
import * as chromeLauncher from "chrome-launcher";
import puppeteer from "puppeteer-core";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT_DIR = "C:\\Users\\Jakda\\AppData\\Local\\Temp\\claude\\C--Users-Jakda-git-Aaronearlerichardson-github-io\\696887e1-177b-4ac2-a4aa-e4c582e6906d\\scratchpad\\screenshots\\";
const BASE = "https://aaronearlerichardson.github.io";

async function main() {
  const chrome = await chromeLauncher.launch({
    chromePath: CHROME_PATH,
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });
  const browser = await puppeteer.connect({ browserURL: `http://localhost:${chrome.port}` });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Home — light
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: OUT_DIR + "home-light.png", fullPage: true });
  console.error("wrote home-light.png");

  // Home — dark
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: OUT_DIR + "home-dark.png", fullPage: true });
  console.error("wrote home-dark.png");

  // Colophon (light)
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await page.goto(BASE + "/colophon/", { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: OUT_DIR + "colophon.png", fullPage: true });
  console.error("wrote colophon.png");

  // Projects index (light)
  await page.goto(BASE + "/projects/", { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: OUT_DIR + "projects-index.png", fullPage: true });
  console.error("wrote projects-index.png");

  await browser.disconnect();
  try { await chrome.kill(); } catch {}
}

main().catch(err => { console.error(err); process.exit(1); });
