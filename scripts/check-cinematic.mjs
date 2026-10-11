import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4321';
const fails = [];
const ok = m => console.log(`✓ ${m}`);
const bad = m => { fails.push(m); console.log(`✗ ${m}`); };

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

async function walk(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= h; y += 300) {
    await page.evaluate(v => window.scrollTo(0, v), y);
    await new Promise(r => setTimeout(r, 120));
  }
  await new Promise(r => setTimeout(r, 1500));
}

const hiddenSelectors = [
  '.section-title .sw', '.featured-image', '.featured-content > *', '.more-row',
  '.about-bio .sw', '.about-education > *', '.contact-inner > *', '.detail-block', '.project-header > *'
];

for (const [path, label] of [['/', 'ES home'], ['/en/', 'EN home'], ['/proyectos/bank-customer-churn/', 'ES detail']]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE + path, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  const active = await page.evaluate(() => document.documentElement.classList.contains('has-cinematic'));
  active ? ok(`${label}: cinematic layer active`) : bad(`${label}: cinematic layer did not start`);
  await walk(page);
  const stuck = await page.evaluate(sels => {
    const out = [];
    for (const s of sels)
      for (const el of document.querySelectorAll(s)) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (parseFloat(getComputedStyle(el).opacity) < 0.99) out.push(`${s} (${(el.textContent || '').trim().slice(0, 24)})`);
      }
    return out;
  }, hiddenSelectors);
  stuck.length === 0 ? ok(`${label}: everything revealed after scrolling`) : bad(`${label}: stuck hidden -> ${stuck.slice(0, 5).join(' | ')}`);
  await page.close();
}

// Anchor navigation lands the section under the sticky header.
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.click('.main-nav a[href$="#about"]');
  await new Promise(r => setTimeout(r, 2500));
  const top = await page.evaluate(() => Math.round(document.querySelector('#about').getBoundingClientRect().top));
  top >= -10 && top <= 200 ? ok(`anchor #about lands at top=${top}px`) : bad(`anchor #about landed at top=${top}px`);
  await page.close();
}

// Reduced motion: no layer, no gsap/lenis chunk downloaded.
{
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const js = [];
  page.on('response', r => /cinematic|gsap|lenis/i.test(r.url()) && js.push(r.url()));
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
  const active = await page.evaluate(() => document.documentElement.classList.contains('has-cinematic'));
  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll('.featured-content > *, .more-row, .section-title')].filter(
      e => parseFloat(getComputedStyle(e).opacity) < 0.99
    ).length
  );
  !active && js.length === 0 && hidden === 0
    ? ok('reduced-motion: static page, scroll chunk not downloaded')
    : bad(`reduced-motion: active=${active} chunks=${js.length} hidden=${hidden}`);
  await page.close();
}

await browser.close();
if (fails.length) { console.log(`\n${fails.length} failure(s)`); process.exit(1); }
console.log('\nAll cinematic checks passed.');
