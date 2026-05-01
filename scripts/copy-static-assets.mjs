import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

const directories = [
  'img',
  'sp-photos',
  'community-photo',
  'ans-photo',
  'vendor',
  'css',
  'js'
];

const files = [
  'pohu.JPG'
];

function shouldCopy(source) {
  const basename = path.basename(source);
  if (basename === '.DS_Store') return false;
  if (basename.toLowerCase().endsWith('.psd')) return false;
  return true;
}

await mkdir(dist, { recursive: true });

for (const directory of directories) {
  const source = path.join(root, directory);
  const target = path.join(dist, directory);
  await rm(target, { recursive: true, force: true });
  await cp(source, target, {
    recursive: true,
    filter: shouldCopy
  });
}

for (const file of files) {
  await cp(path.join(root, file), path.join(dist, file));
}

console.log(`Copied ${directories.length} legacy asset directories and ${files.length} root asset file into dist.`);
