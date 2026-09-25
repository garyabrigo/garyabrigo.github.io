import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4321';
const DIST_DIR = path.resolve('dist');

const projectsData = JSON.parse(fs.readFileSync('/home/tars/Proyectos/CV/portfolio-spec/projects.json', 'utf-8'));
const projects = projectsData.projects;

const pages = [
  '/',
  '/en/',
  '/cv/',
  '/en/cv/',
  ...projects.flatMap(p => [`/proyectos/${p.id}/`, `/en/projects/${p.id}/`])
];

const failures = [];

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

for (const pagePath of pages) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const response = await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle0' });
  if (!response || response.status() >= 400) {
    failures.push({ page: pagePath, type: 'page', src: pagePath, status: response?.status() || 0 });
    await page.close();
    continue;
  }

  // Scroll to bottom to trigger lazy-loaded images.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 300));

  const images = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.getAttribute('src') || '',
      resolvedSrc: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
      width: img.width,
      height: img.height,
      selector: img.closest('[id]')?.id || img.className || img.tagName
    }));
  });

  for (const img of images) {
    const src = img.src;
    const resolvedSrc = img.resolvedSrc;
    if (!src) continue; // skip placeholder images without src

    // Skip external images (Google Fonts, etc.)
    if (resolvedSrc.startsWith('http') && !resolvedSrc.includes(new URL(BASE_URL).hostname)) continue;

    // Check HTTP status for local assets.
    if (resolvedSrc.includes(new URL(BASE_URL).hostname)) {
      const assetPath = new URL(resolvedSrc).pathname;
      const filePath = path.join(DIST_DIR, assetPath);
      const exists = fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
      if (!exists) {
        failures.push({
          page: pagePath,
          type: 'missing-file',
          src: resolvedSrc,
          detail: `File not found or empty: ${filePath}`
        });
        continue;
      }
    }

    if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
      failures.push({
        page: pagePath,
        type: 'broken-image',
        src: resolvedSrc,
        detail: `complete=${img.complete} naturalWidth=${img.naturalWidth} naturalHeight=${img.naturalHeight}`
      });
    }
  }

  await page.close();
}

await browser.close();

if (failures.length === 0) {
  console.log(`✓ All images loaded correctly across ${pages.length} pages.`);
  process.exit(0);
} else {
  console.error(`✗ ${failures.length} image failure(s):`);
  for (const f of failures) {
    console.error(`  [${f.page}] ${f.type}: ${f.src}${f.detail ? ` (${f.detail})` : ''}`);
  }
  process.exit(1);
}
