import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4321';
const projects = JSON.parse(fs.readFileSync('/home/tars/Proyectos/CV/portfolio-spec/projects.json', 'utf-8')).projects;

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const failures = [];

for (const lang of ['es', 'en']) {
  for (const project of projects) {
    const path = lang === 'es' ? `/proyectos/${project.id}/` : `/en/projects/${project.id}/`;
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle0' });

    const thumbs = await page.$$('[data-gallery] .gallery-thumb');
    if (thumbs.length === 0) {
      await page.close();
      continue; // no gallery
    }

    // Open first image
    await thumbs[0].click();
    await new Promise(r => setTimeout(r, 200));

    const isOpen = await page.evaluate(() => document.querySelector('.lightbox')?.classList.contains('lightbox-open'));
    if (!isOpen) {
      failures.push({ path, issue: 'lightbox did not open' });
      await page.close();
      continue;
    }

    // Check image loaded
    const imgLoaded = await page.evaluate(() => {
      const img = document.querySelector('.lightbox-image');
      return img && img.complete && img.naturalWidth > 0;
    });
    if (!imgLoaded) {
      failures.push({ path, issue: 'lightbox image did not load' });
    }

    // Navigate next if multiple images
    if (thumbs.length > 1) {
      const firstSrc = await page.evaluate(() => document.querySelector('.lightbox-image').src);
      await page.click('.lightbox-next');
      await new Promise(r => setTimeout(r, 200));
      const secondSrc = await page.evaluate(() => document.querySelector('.lightbox-image').src);
      if (firstSrc === secondSrc) {
        failures.push({ path, issue: 'next navigation did not change image' });
      }
      await page.click('.lightbox-prev');
      await new Promise(r => setTimeout(r, 200));
      const backSrc = await page.evaluate(() => document.querySelector('.lightbox-image').src);
      if (backSrc !== firstSrc) {
        failures.push({ path, issue: 'prev navigation did not return to first image' });
      }
    }

    // Close with Escape
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 200));
    const isClosed = await page.evaluate(() => !document.querySelector('.lightbox')?.classList.contains('lightbox-open'));
    if (!isClosed) {
      failures.push({ path, issue: 'Escape did not close lightbox' });
    }

    await page.close();
  }
}

await browser.close();

if (failures.length === 0) {
  console.log('✓ All galleries open, navigate and close correctly in ES and EN.');
  process.exit(0);
} else {
  console.error(`✗ ${failures.length} gallery failure(s):`);
  for (const f of failures) {
    console.error(`  ${f.path}: ${f.issue}`);
  }
  process.exit(1);
}
