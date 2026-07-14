// Precision Neuroscience's careers site (careers.kula.ai) is a client-rendered
// Next.js app — the crawler's fetch_kula() (which parses static HTML with
// BeautifulSoup) finds zero jobs there because the listing only exists after
// JS hydration. Real fix: render it with a real browser (the same Chrome we
// already use for Lighthouse) and read the DOM after hydration, instead of
// fabricating or skipping this named target company.
import fs from "node:fs";
import * as chromeLauncher from "chrome-launcher";
import puppeteer from "puppeteer-core";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function main() {
  const chrome = await chromeLauncher.launch({
    chromePath: CHROME_PATH,
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });
  const browser = await puppeteer.connect({ browserURL: `http://localhost:${chrome.port}` });
  const page = await browser.newPage();

  await page.goto("https://careers.kula.ai/precision-neuroscience", { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForSelector("a[href*='/precision-neuroscience/']", { timeout: 15000 }).catch(() => {});
  const links = await page.evaluate(() => {
    const as = Array.from(document.querySelectorAll("a[href*='/precision-neuroscience/']"));
    return as
      .map(a => ({ href: a.href, text: a.textContent.trim() }))
      .filter(x => /\/precision-neuroscience\/\d+/.test(x.href));
  });
  const seen = new Set();
  const uniqueLinks = links.filter(l => (seen.has(l.href) ? false : (seen.add(l.href), true)));
  console.error(`Found ${uniqueLinks.length} job links`);

  const jobs = [];
  for (const l of uniqueLinks) {
    await page.goto(l.href, { waitUntil: "networkidle0", timeout: 30000 });
    await new Promise(r => setTimeout(r, 500));
    const { title, bodyText } = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      return { title: h1 ? h1.textContent.trim() : document.title, bodyText: document.body.innerText };
    });
    console.error(`  ${title} (${bodyText.length} chars) — ${l.href}`);
    jobs.push({ company: "Precision Neuroscience", ats: "kula", title, url: l.href, description: bodyText });
  }

  fs.writeFileSync("out/precision-neuroscience-jobs.json", JSON.stringify(jobs, null, 2));
  console.error(`Wrote ${jobs.length} jobs to out/precision-neuroscience-jobs.json`);

  await browser.disconnect();
  try { await chrome.kill(); } catch {}
}

main().catch(err => { console.error(err); process.exit(1); });
