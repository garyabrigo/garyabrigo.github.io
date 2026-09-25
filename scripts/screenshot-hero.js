import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://127.0.0.1:4321/';
const OUT_DIR = '/home/tars/.herdr-projects/cv/threads/t-0004/.herdr-project/cv-t-0004/library';

fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

async function screenshot(name, width, height) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500)); // let video start
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`Saved ${file}`);
  await page.close();
}

await screenshot('hero-desktop-1440', 1440, 900);
await screenshot('hero-mobile-390', 390, 844);

await browser.close();
