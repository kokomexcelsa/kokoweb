import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const legacyUrlManifestPath = path.join(root, 'legacy-url-manifest.json');

const directories = [
  'img',
  'sp-photos',
  'community-photo',
  'ans-photo',
  'vendor',
  'css',
  'js'
];

const passthroughDirectories = [
  'ans',
  'blog-template',
  'cart-template',
  'company-template',
  'data-template',
  'private'
];

const files = [
  'pohu.JPG'
];

const generatedLegacyCategories = new Set([
  'community-index',
  'community-period',
  'home',
  'speech-detail',
  'speech-index'
]);

const exactCopyCategories = new Set([
  'search-verification'
]);

function shouldCopy(source) {
  const basename = path.basename(source);
  if (basename === '.DS_Store') return false;
  if (basename.toLowerCase().endsWith('.psd')) return false;
  return true;
}

function hasHead(html) {
  return /<head(?:\s[^>]*)?>/i.test(html);
}

function hasRobotsMeta(html) {
  return /<meta\s+[^>]*name=["']robots["']/i.test(html);
}

function hasCanonical(html) {
  return /<link\s+[^>]*rel=["']canonical["']/i.test(html);
}

function injectLegacyHeadTags(html, record) {
  if (!hasHead(html) || exactCopyCategories.has(record.category)) {
    return html;
  }

  const tags = [];
  if (record.noindex && !hasRobotsMeta(html)) {
    tags.push('    <meta name="robots" content="noindex, follow">');
  }
  if (record.canonical && !hasCanonical(html)) {
    tags.push(`    <link rel="canonical" href="${record.canonical}">`);
  }

  if (tags.length === 0) {
    return html;
  }

  return html.replace(/<head(?:\s[^>]*)?>/i, (match) => `${match}\n${tags.join('\n')}`);
}

async function copyLegacyPassthroughHtml() {
  const manifest = JSON.parse(await readFile(legacyUrlManifestPath, 'utf8'));
  let copied = 0;

  for (const record of manifest) {
    if (record.deploy === false) continue;
    if (generatedLegacyCategories.has(record.category)) continue;

    const source = path.join(root, record.source);
    const target = path.join(dist, record.path.replace(/^\//, ''));
    await mkdir(path.dirname(target), { recursive: true });

    if (exactCopyCategories.has(record.category)) {
      await cp(source, target);
    } else {
      const html = await readFile(source, 'utf8');
      await writeFile(target, injectLegacyHeadTags(html, record));
    }
    copied += 1;
  }

  return copied;
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

for (const directory of passthroughDirectories) {
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

const passthroughHtmlCount = await copyLegacyPassthroughHtml();
await writeFile(path.join(dist, '.nojekyll'), '');

console.log(`Copied ${directories.length} shared asset directories, ${passthroughDirectories.length} passthrough directories, ${files.length} root asset file, and ${passthroughHtmlCount} legacy passthrough HTML files into dist.`);
