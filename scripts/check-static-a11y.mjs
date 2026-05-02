import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const dist = path.join(process.cwd(), 'dist');
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

if (!existsSync(dist)) {
  throw new Error('dist does not exist. Run npm run build before npm run check:a11y.');
}

const htmlFiles = walk(dist).filter((file) => {
  const relative = path.relative(dist, file);
  return generatedRoots.has(relative) || relative.startsWith('speech/') || relative.startsWith('community/');
});

for (const file of htmlFiles) {
  const relative = path.relative(dist, file);
  const $ = cheerio.load(readFileSync(file, 'utf8'));
  if (!$('main#main').length) {
    errors.push(`${relative}: missing main#main`);
  }
  if (!$('a.skip-link[href="#main"]').length) {
    errors.push(`${relative}: missing skip link`);
  }
  $('img').each((_, image) => {
    const alt = $(image).attr('alt');
    if (alt === undefined || alt.trim() === '') {
      errors.push(`${relative}: image missing alt (${($(image).attr('src') ?? '').slice(0, 80)})`);
    }
  });
  $('a[href]').each((_, anchor) => {
    if ($(anchor).text().replace(/\s+/g, '').length === 0 && !$(anchor).attr('aria-label')) {
      errors.push(`${relative}: link missing text or aria-label (${($(anchor).attr('href') ?? '').slice(0, 80)})`);
    }
  });
}

if (errors.length > 0) {
  throw new Error(errors.join('\n'));
}

console.log(`Checked ${htmlFiles.length} generated HTML files for static accessibility basics.`);
