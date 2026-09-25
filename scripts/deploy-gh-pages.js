import { execSync } from 'node:child_process';
import path from 'node:path';

// Publishes the already-built dist/ to the gh-pages branch of
// garyabrigo/garyabrigo.github.io. Run via `npm run deploy` (which builds
// first). `astro build` wipes dist/ on every run, so dist/.git can't
// survive between builds -- this always starts a fresh history and
// force-pushes, which is standard for a "latest snapshot" deploy branch.

const DIST = path.resolve('dist');
const REMOTE = 'https://github.com/garyabrigo/garyabrigo.github.io.git';

function run(cmd, cwd = DIST) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd });
}

const sourceSha = execSync('git rev-parse --short HEAD', { cwd: path.resolve('.') })
  .toString()
  .trim();

run('git init -q');
run('git checkout -q -B gh-pages');
run('git add -A');
run(`git commit -q -m "Deploy ${sourceSha}" --allow-empty`);
try {
  run('git remote remove origin');
} catch {
  // no existing remote, fine
}
run(`git remote add origin ${REMOTE}`);
run('git push --force origin gh-pages');

console.log('\nDeployed. Live at https://garyabrigo.github.io/ (allow a minute or two for GitHub Pages to rebuild).');
