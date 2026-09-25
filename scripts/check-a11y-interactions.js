import puppeteer from 'puppeteer-core';

const BASE_URL = 'http://127.0.0.1:4321';
let failures = [];

function fail(msg) {
  failures.push(msg);
  console.log(`✗ ${msg}`);
}

async function withPage(browser, fn) {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 800 });
  await fn(page);
  await page.close();
}

async function testMobileMenu(browser, path, label) {
  await withPage(browser, async page => {
    await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle0' });

    const initiallyReachable = await page.evaluate(() => {
      const nav = document.getElementById('site-nav');
      return nav ? getComputedStyle(nav).display !== 'none' : false;
    });
    if (initiallyReachable) fail(`${label}: nav visible before opening the mobile menu (should be hidden)`);

    await page.click('.nav-toggle');
    const state = await page.evaluate(() => {
      const nav = document.getElementById('site-nav');
      const toggle = document.querySelector('.nav-toggle');
      const links = nav ? Array.from(nav.querySelectorAll('a')).map(a => a.textContent?.trim()) : [];
      return {
        expanded: toggle?.getAttribute('aria-expanded'),
        visible: nav ? getComputedStyle(nav).display !== 'none' : false,
        active: document.activeElement?.tagName,
        links
      };
    });
    if (state.expanded !== 'true') fail(`${label}: aria-expanded not set to true after opening`);
    if (!state.visible) fail(`${label}: nav not visible after opening`);
    if (state.active !== 'A') fail(`${label}: focus did not move into the nav (got ${state.active})`);
    const expectedCount = 4; // Proyectos/About, Sobre mi, Contacto, CV
    if (state.links.length !== expectedCount) fail(`${label}: expected ${expectedCount} nav links, found ${state.links.length} (${state.links.join(', ')})`);

    await page.keyboard.press('Escape');
    const afterEscape = await page.evaluate(() => {
      const nav = document.getElementById('site-nav');
      const toggle = document.querySelector('.nav-toggle');
      return {
        expanded: toggle?.getAttribute('aria-expanded'),
        visible: nav ? getComputedStyle(nav).display !== 'none' : false,
        activeIsToggle: document.activeElement === toggle
      };
    });
    if (afterEscape.expanded !== 'false') fail(`${label}: aria-expanded not reset after Escape`);
    if (afterEscape.visible) fail(`${label}: nav still visible after Escape`);
    if (!afterEscape.activeIsToggle) fail(`${label}: focus did not return to the toggle button after Escape`);

    console.log(`✓ ${label}: mobile menu opens, exposes ${state.links.length} links, closes on Escape, returns focus`);
  });
}

async function testLightboxFocusTrap(browser, path, label) {
  await withPage(browser, async page => {
    await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle0' });
    const hasGallery = await page.$('.gallery-thumb');
    if (!hasGallery) {
      console.log(`— ${label}: no gallery thumbnails on this page, skipping`);
      return;
    }

    await page.click('.gallery-thumb');
    await new Promise(r => setTimeout(r, 100));

    const opened = await page.evaluate(() => document.querySelector('.lightbox')?.classList.contains('lightbox-open'));
    if (!opened) {
      fail(`${label}: lightbox did not open on thumbnail click`);
      return;
    }

    // Tab forward through every focusable control several times; focus must never leave the lightbox controls.
    let escaped = false;
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      const insideLightbox = await page.evaluate(() => {
        const active = document.activeElement;
        return !!active && !!active.closest('.lightbox');
      });
      if (!insideLightbox) {
        escaped = true;
        break;
      }
    }
    if (escaped) fail(`${label}: Tab moved focus outside the lightbox (focus trap not working)`);
    else console.log(`✓ ${label}: Tab stays trapped inside the lightbox`);

    // Shift+Tab should also stay trapped.
    let escapedBack = false;
    for (let i = 0; i < 8; i++) {
      await page.keyboard.down('Shift');
      await page.keyboard.press('Tab');
      await page.keyboard.up('Shift');
      const insideLightbox = await page.evaluate(() => {
        const active = document.activeElement;
        return !!active && !!active.closest('.lightbox');
      });
      if (!insideLightbox) {
        escapedBack = true;
        break;
      }
    }
    if (escapedBack) fail(`${label}: Shift+Tab moved focus outside the lightbox`);
    else console.log(`✓ ${label}: Shift+Tab stays trapped inside the lightbox`);

    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 100));
    const closed = await page.evaluate(() => !document.querySelector('.lightbox')?.classList.contains('lightbox-open'));
    if (!closed) fail(`${label}: lightbox did not close on Escape`);

    const focusReturned = await page.evaluate(() => {
      const active = document.activeElement;
      return !!active && active.classList.contains('gallery-thumb');
    });
    if (!focusReturned) fail(`${label}: focus was not returned to the thumbnail that opened the lightbox`);
    else console.log(`✓ ${label}: focus returned to the triggering thumbnail after close`);
  });
}

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

await testMobileMenu(browser, '/', 'ES home');
await testMobileMenu(browser, '/en/', 'EN home');
await testLightboxFocusTrap(browser, '/proyectos/bank-customer-churn/', 'ES project detail');
await testLightboxFocusTrap(browser, '/en/projects/bank-customer-churn/', 'EN project detail');

await browser.close();

if (failures.length > 0) {
  console.log(`\n${failures.length} failure(s).`);
  process.exit(1);
} else {
  console.log('\nAll interaction checks passed.');
}
