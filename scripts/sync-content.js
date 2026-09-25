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
for (const file of fs.readdirSync(sourceAssets)) {
  if (!file.endsWith('.webp')) continue;
  fs.copyFileSync(path.join(sourceAssets, file), path.join(destAssets, file));
}
console.log('Synced assets');
