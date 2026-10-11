import puppeteer from 'puppeteer-core';

// A/B cost profile of the home page: how much main-thread/compositor work each
// feature costs while idle on the hero and while scrolling. Compare variants,
// not absolute numbers (headless uses software rendering).
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4321/';

const variants = {
  baseline: {},
  'no-particles': { noParticles: true },
  'no-backdrop': { css: '.site-header{backdrop-filter:none!important}' },
  'no-video': { blockVideo: true },
  'no-parallax': { css: '.hero-poster,.hero-video{transform:none!important}' },
  'none-of-them': {
    noParticles: true,
    blockVideo: true,
    css: '.site-header{backdrop-filter:none!important}'
  }
};

async function measure(browser, name, opts) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  if (opts.blockVideo) {
    await page.setRequestInterception(true);
    page.on('request', r => (/\.(webm|mp4)$/.test(r.url()) ? r.abort() : r.continue()));
  }
  if (opts.noParticles) {
    await page.evaluateOnNewDocument(() => {
      new MutationObserver(() => document.querySelector('[data-particles]')?.remove())
        .observe(document, { childList: true, subtree: true });
    });
  }
  const client = await page.createCDPSession();
  await client.send('Performance.enable');
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  if (opts.css) await page.addStyleTag({ content: opts.css });
  await new Promise(r => setTimeout(r, 2500));

  const snap = async () => {
    const { metrics } = await client.send('Performance.getMetrics');
    return Object.fromEntries(metrics.map(m => [m.name, m.value]));
  };
  const frames = (ms, scroll) =>
    page.evaluate(
      (ms, scroll) =>
        new Promise(resolve => {
          let n = 0;
          const t0 = performance.now();
          const worst = [];
          let last = t0;
          const tick = now => {
            n++;
            worst.push(now - last);
            last = now;
            if (scroll) window.scrollTo(0, ((now - t0) / ms) * 1400);
            if (now - t0 < ms) requestAnimationFrame(tick);
            else {
              worst.sort((a, b) => b - a);
              resolve({ fps: (n / ((now - t0) / 1000)).toFixed(1), worst: worst[0].toFixed(0) });
            }
          };
          requestAnimationFrame(tick);
        }),
      ms,
      scroll
    );

  const a = await snap();
  const idle = await frames(3000, false);
  const b = await snap();
  await page.evaluate(() => window.scrollTo(0, 0));
  const scroll = await frames(3000, true);
  const c = await snap();

  const cpu = (x, y) => (((y.TaskDuration - x.TaskDuration) / 3) * 100).toFixed(0);
  console.log(
    `${name.padEnd(14)} idle: ${idle.fps} fps (worst frame ${idle.worst}ms, main-thread ${cpu(a, b)}%)` +
      ` | scroll: ${scroll.fps} fps (worst ${scroll.worst}ms, main-thread ${cpu(b, c)}%)`
  );
  await page.close();
}

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
});
const only = process.argv[2];
for (const [name, opts] of Object.entries(variants)) {
  if (only && only !== name) continue;
  await measure(browser, name, opts);
}
await browser.close();
