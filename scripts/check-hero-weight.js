import puppeteer from 'puppeteer-core';

const BASE_URL = 'http://127.0.0.1:4321/';

async function measure(reducedMotion = false) {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  if (reducedMotion) {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  }

  const resources = [];
  page.on('response', async response => {
    try {
      const url = response.url();
      const headers = response.headers();
      const length = headers['content-length'];
      const size = length ? parseInt(length, 10) : (await response.buffer()).length;
      resources.push({ url, size });
    } catch {}
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const total = resources.reduce((a, b) => a + b.size, 0);
  const video = resources.filter(r => /\.(webm|mp4)$/.test(r.url));
  const videoSize = video.reduce((a, b) => a + b.size, 0);

  console.log(`\n${reducedMotion ? 'Reduced motion (no video)' : 'Normal load (with video)'}`);
  console.log(`  Total: ${(total / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Video: ${video.length} file(s), ${(videoSize / 1024).toFixed(0)} KB`);
  console.log(`  Without video: ${((total - videoSize) / 1024 / 1024).toFixed(2)} MB`);

  await browser.close();
  return { total, videoSize };
}

const normal = await measure(false);
const reduced = await measure(true);

console.log('\nSummary:');
console.log(`  First paint resources (HTML/CSS/fonts/poster): ${((reduced.total) / 1024 / 1024).toFixed(2)} MB`);
console.log(`  With autoplay video loaded: ${((normal.total) / 1024 / 1024).toFixed(2)} MB`);
