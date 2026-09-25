import fs from 'node:fs';
import path from 'node:path';

// Mirrors CV_ENABLED in src/lib/data.ts. When the CV PDFs aren't approved yet,
// remove the built /cv/ and /en/cv/ pages and their sitemap entries so nothing
// "coming soon" stays reachable or indexed. Set CV_ENABLED=true to keep them.
const CV_ENABLED = process.env.CV_ENABLED === 'true';
const DIST = path.resolve('dist');

if (CV_ENABLED) {
  console.log('CV_ENABLED=true — keeping /cv/ and /en/cv/ in dist/.');
  process.exit(0);
}

let removed = false;
for (const dir of [path.join(DIST, 'cv'), path.join(DIST, 'en', 'cv')]) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`Removed ${path.relative(DIST, dir)}/`);
    removed = true;
  }
}

const sitemapPath = path.join(DIST, 'sitemap-0.xml');
if (fs.existsSync(sitemapPath)) {
  const before = fs.readFileSync(sitemapPath, 'utf-8');
  const after = before
    .replace(/<url><loc>[^<]*\/cv\/<\/loc><\/url>/g, '')
    .replace(/<url><loc>[^<]*\/en\/cv\/<\/loc><\/url>/g, '');
  if (after !== before) {
    fs.writeFileSync(sitemapPath, after);
    console.log('Removed /cv/ and /en/cv/ from sitemap-0.xml');
    removed = true;
  }
}

if (!removed) {
  console.log('No /cv/ or /en/cv/ output found (already excluded).');
}
