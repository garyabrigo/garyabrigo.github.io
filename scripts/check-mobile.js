import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle0' });

const width = await page.evaluate(() => document.documentElement.scrollWidth);
const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
const hasHorizontalScroll = width > clientWidth;

console.log('Viewport width:', clientWidth);
console.log('Document scroll width:', width);
console.log('Horizontal scroll:', hasHorizontalScroll ? 'YES' : 'NO');

if (hasHorizontalScroll) {
  const overflows = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    const out = [];
    for (const el of all) {
      if (el.scrollWidth > document.documentElement.clientWidth) {
        out.push(el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''));
      }
    }
    return out.slice(0, 10);
  });
  console.log('Overflowing elements:', overflows);
}

await browser.close();
