import fs from 'node:fs';
import path from 'node:path';

const sourceJson = '/home/tars/Proyectos/CV/portfolio-spec/projects.json';
const destJson = path.resolve('src/content/projects.json');
const sourceAssets = '/home/tars/Proyectos/CV/portfolio-spec/assets';
const destAssets = path.resolve('public/assets');

fs.mkdirSync(path.dirname(destJson), { recursive: true });
fs.copyFileSync(sourceJson, destJson);
console.log('Synced projects.json');

fs.mkdirSync(destAssets, { recursive: true });

// Working/reference material that the site never links to (raw hero footage,
// design-review screenshots) -- keep it out of public/ and dist/.
const EXCLUDED_DIRS = new Set(['source', 'preview']);

function syncDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      syncDir(srcPath, destPath);
    } else if (entry.name.endsWith('.webp') || entry.name.endsWith('.webm') || entry.name.endsWith('.mp4')) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

syncDir(sourceAssets, destAssets);
console.log('Synced assets');
