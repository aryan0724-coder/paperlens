// Zips the built `dist/` into paperlens-<version>.zip for the Chrome Web Store.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const dist = resolve(root, 'dist');

if (!existsSync(dist)) {
  console.error('No dist/ found - run `npm run build` first.');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const out = resolve(root, `paperlens-${pkg.version}.zip`);
if (existsSync(out)) rmSync(out);

if (process.platform === 'win32') {
  const ps1 = resolve(here, 'zip-dist.ps1');
  execSync(
    `powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1}" -Dist "${dist}" -Out "${out}"`,
    { stdio: 'inherit' },
  );
} else {
  execSync(`cd "${dist}" && zip -r "${out}" .`, { stdio: 'inherit' });
}

console.log('\nPackaged ->', out);
