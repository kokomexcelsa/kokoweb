import { readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const ignoredDirectories = new Set([
  '.git',
  'node_modules',
  'dist',
  'public',
  'src',
  'content',
  'scripts'
]);

const htmlFiles = [];
const publicFiles = [];

const alwaysPublicFiles = new Set([
  'sitemap.xml',
  'google0d273919ce2cabd0.html',
  'pohu.JPG',
  'fix.patch'
]);

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function categoryFor(relativePath) {
  if (relativePath === 'index.html') return 'home';
  if (relativePath === 'speech.html') return 'speech-index';
  if (/^speech\/sp.+\.html$/.test(relativePath)) return 'speech-detail';
  if (relativePath === 'community/community.html') return 'community-index';
  if (/^community\/community-\d{4}\.html$/.test(relativePath)) return 'community-period';
  if (relativePath === 'ans/ask-ans.html') return 'legacy-answer';
  if (relativePath === 'private/account-terms.html') return 'legal';
  if (relativePath.endsWith('-template/blogT.html')) return 'legacy-template';
  if (relativePath.endsWith('-template/cartT.html')) return 'legacy-template';
  if (relativePath.endsWith('-template/companyT.html')) return 'legacy-template';
  if (relativePath.endsWith('-template/dataT.html')) return 'legacy-template';
  if (relativePath === 'google0d273919ce2cabd0.html') return 'search-verification';
  if (relativePath === 'index-old.html') return 'legacy-archive';
  return 'legacy-html';
}

function sitemapFlag(relativePath, category) {
  if (category === 'search-verification') return false;
  if (category === 'legacy-template') return false;
  if (category === 'legacy-archive') return false;
  if (category === 'legacy-answer') return false;
  if (category === 'legal') return false;
  if (relativePath.startsWith('private/')) return false;
  return true;
}

function noindexFlag(category) {
  return [
    'search-verification',
    'legacy-template',
    'legacy-archive',
    'legacy-answer',
    'legal'
  ].includes(category);
}

function canonicalFor(relativePath) {
  return `https://kokomexcelsa.github.io/kokoweb/${relativePath}`;
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    const relativePath = toPosix(path.relative(root, fullPath));

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        await walk(fullPath);
      }
      continue;
    }

    if (!entry.isFile()) continue;

    if (relativePath.endsWith('.html')) {
      htmlFiles.push(relativePath);
      continue;
    }

    if (alwaysPublicFiles.has(relativePath)) {
      publicFiles.push(relativePath);
    }
  }
}

await walk(root);

const legacyUrlManifest = htmlFiles.sort().map((source) => {
  const category = categoryFor(source);

  return {
    path: `/${source}`,
    source,
    category,
    migrationStatus: 'pending',
    sitemap: sitemapFlag(source, category),
    noindex: noindexFlag(category),
    deploy: true,
    canonical: canonicalFor(source)
  };
});

const legacyPublicFileManifest = publicFiles.sort().map((source) => ({
  path: `/${source}`,
  source,
  category: source === 'sitemap.xml' ? 'sitemap' : source === 'fix.patch' ? 'patch-file' : 'public-file',
  deploy: source === 'fix.patch' ? false : true,
  requiresApprovalToRemove: true
}));

await writeFile(
  path.join(root, 'legacy-url-manifest.json'),
  `${JSON.stringify(legacyUrlManifest, null, 2)}\n`
);

await writeFile(
  path.join(root, 'legacy-public-file-manifest.json'),
  `${JSON.stringify(legacyPublicFileManifest, null, 2)}\n`
);

console.log(`Wrote ${legacyUrlManifest.length} legacy HTML URL records.`);
console.log(`Wrote ${legacyPublicFileManifest.length} public file records.`);
