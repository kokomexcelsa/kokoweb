import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const legacyUrlManifest = JSON.parse(readFileSync(path.join(root, 'legacy-url-manifest.json'), 'utf8'));
const legacyPublicFileManifest = JSON.parse(readFileSync(path.join(root, 'legacy-public-file-manifest.json'), 'utf8'));

const exactCopyCategories = new Set(['search-verification']);
const errors = [];
let checked = 0;

function targetFor(manifestPath) {
  return path.join(dist, manifestPath.replace(/^\//, ''));
}

function checkPath(record, kind) {
  if (record.deploy === false) return;
  checked += 1;

  const target = targetFor(record.path);
  if (!existsSync(target)) {
    errors.push(`${kind}: ${record.path} is marked deploy=true but missing from dist`);
    return;
  }

  if (kind === 'html' && record.noindex && !exactCopyCategories.has(record.category)) {
    const html = readFileSync(target, 'utf8');
    if (!/<meta\s+[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) {
      errors.push(`${kind}: ${record.path} is marked noindex but generated output has no robots noindex tag`);
    }
  }
}

for (const record of legacyUrlManifest) {
  checkPath(record, 'html');
}

for (const record of legacyPublicFileManifest) {
  checkPath(record, 'public-file');
}

if (errors.length > 0) {
  throw new Error(errors.join('\n'));
}

console.log(`Checked ${checked} deployed legacy URLs and public files.`);
