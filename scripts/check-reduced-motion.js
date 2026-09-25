import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.setViewport({ width: 1280, height: 800 });
await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle0' });

const chartLine = await page.$('.chart-line');
const dashoffset = chartLine ? await page.evaluate(el => getComputedStyle(el).strokeDashoffset, chartLine) : null;
console.log('Reduced motion: chart-line stroke-dashoffset =', dashoffset);
console.log('Expected: 0 (chart already drawn, no animation)');

await browser.close();
