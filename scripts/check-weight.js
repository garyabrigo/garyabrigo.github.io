import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });

let totalBytes = 0;
page.on('response', async response => {
  try {
    const headers = response.headers();
    const length = headers['content-length'];
    if (length) {
      totalBytes += parseInt(length, 10);
    } else {
      const buffer = await response.buffer();
      totalBytes += buffer.length;
    }
  } catch {}
});

await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle0' });

console.log('Total transfer size (home, light theme):', (totalBytes / 1024 / 1024).toFixed(2), 'MB');

await browser.close();
