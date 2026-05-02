import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const root = process.cwd();
const dist = path.join(root, 'dist');
const base = '/kokoweb';
const errors = [];
const generatedRoots = new Set([
  'index.html',
  'about.html',
  'speech.html',
  'contributions.html',
  'mvp.html',
  'mvp-2026.html',
  '404.html'
]);

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolute));
    } else if (entry.name.endsWith('.html')) {
      files.push(absolute);
    }
  }
  return files;
}

function shouldCheck(file) {
  const relative = path.relative(dist, file).split(path.sep).join('/');
  return generatedRoots.has(relative) || relative.startsWith('speech/') || relative.startsWith('community/');
}

function isSkippable(url) {
  return (
    !url ||
    url.startsWith('#') ||
    url.startsWith('mailto:') ||
    url.startsWith('tel:') ||
    url.startsWith('javascript:') ||
    url.startsWith('data:') ||
    /^https?:\/\//.test(url)
  );
}

function stripUrl(url) {
  return url.split('#')[0].split('?')[0];
}

function resolveTarget(file, rawUrl) {
  const cleanUrl = stripUrl(rawUrl);
  if (isSkippable(cleanUrl)) return null;

  let relativeTarget;
  if (cleanUrl === base || cleanUrl === `${base}/`) {
    relativeTarget = 'index.html';
  } else if (cleanUrl.startsWith(`${base}/`)) {
    relativeTarget = cleanUrl.slice(base.length + 1);
  } else if (cleanUrl.startsWith('/')) {
    relativeTarget = cleanUrl.slice(1);
  } else {
    const fromDir = path.dirname(path.relative(dist, file));
    relativeTarget = path.normalize(path.join(fromDir, cleanUrl)).split(path.sep).join('/');
  }

  if (!relativeTarget || relativeTarget === '.') {
    relativeTarget = 'index.html';
  }
  if (relativeTarget.endsWith('/')) {
    relativeTarget = `${relativeTarget}index.html`;
  }
  return relativeTarget;
}

function assertExists(file, attr, rawUrl) {
  const target = resolveTarget(file, rawUrl);
  if (!target) return;
  const absoluteTarget = path.join(dist, target);
  if (!existsSync(absoluteTarget)) {
    const owner = path.relative(dist, file).split(path.sep).join('/');
    errors.push(`${owner}: ${attr} points to missing local file: ${rawUrl} -> ${target}`);
  }
}

if (!existsSync(dist)) {
  throw new Error('dist does not exist. Run npm run build before npm run check:links.');
}

const htmlFiles = walk(dist).filter(shouldCheck);
for (const file of htmlFiles) {
  const $ = cheerio.load(readFileSync(file, 'utf8'));
  $('a[href]').each((_, element) => assertExists(file, 'href', $(element).attr('href') ?? ''));
  $('img[src], script[src]').each((_, element) => assertExists(file, 'src', $(element).attr('src') ?? ''));
  $('link[href]').each((_, element) => {
    const rel = ($(element).attr('rel') ?? '').toLowerCase();
    if (rel.includes('canonical')) return;
    assertExists(file, 'href', $(element).attr('href') ?? '');
  });
}

if (errors.length > 0) {
  throw new Error(errors.join('\n'));
}

console.log(`Checked local links and assets in ${htmlFiles.length} generated HTML files.`);
