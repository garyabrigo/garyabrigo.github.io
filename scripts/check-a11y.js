import puppeteer from 'puppeteer-core';
import axeCore from 'axe-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const urls = [
  { path: '/', name: 'ES home' },
  { path: '/en/', name: 'EN home' },
  { path: '/proyectos/bank-customer-churn/', name: 'ES project detail' },
  { path: '/en/projects/bank-customer-churn/', name: 'EN project detail' }
];

for (const { path, name } of urls) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(`http://127.0.0.1:4321${path}`, { waitUntil: 'networkidle0' });

  const results = await page.evaluate((axeSource) => {
    // @ts-ignore
    eval(axeSource);
    // @ts-ignore
    return axe.run(document, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
  }, axeCore.source);

  const violations = results.violations;
  console.log(`\n${name} (${path})`);
  console.log('Violations:', violations.length);
  for (const v of violations) {
    console.log(`  - ${v.id}: ${v.description}`);
    for (const n of v.nodes) {
      console.log(`    * ${n.target.join(' ')}`);
      console.log(`      ${n.failureSummary?.split('\n').map(s => s.trim()).filter(Boolean).join(' | ')}`);
    }
  }
  await page.close();
}

await browser.close();
