import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import * as cheerio from 'cheerio';

const root = process.cwd();
const dist = path.join(root, 'dist');
const contributionRoot = path.join(root, 'content/contributions');
const communityRoot = path.join(root, 'content/community-periods');
const errors = [];
const warnings = [];
const ids = new Set();
const legacyPaths = new Set();

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolute));
    } else if (/\.(ya?ml|json)$/i.test(entry.name)) {
      files.push(absolute);
    }
  }
  return files;
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function checkLocalAsset(assetPath, owner) {
  if (!assetPath || /^https?:\/\//.test(assetPath) || assetPath.startsWith('data:')) return;
  const normalized = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  const candidates = [
    path.join(root, normalized),
    path.join(dist, normalized)
  ];
  if (!candidates.some((candidate) => existsSync(candidate))) {
    errors.push(`${owner}: local evidence asset does not exist: ${assetPath}`);
  }
}

function hasEvidence(evidence) {
  return asArray(evidence).some((item) => item?.href || item?.src);
}

function checkEvidence(evidence, owner) {
  const items = asArray(evidence);
  if (!hasEvidence(items)) {
    errors.push(`${owner}: missing evidence href/src`);
    return;
  }

  for (const item of items) {
    if (!item?.href && !item?.src) {
      errors.push(`${owner}: evidence item needs href or src`);
    }
    checkLocalAsset(item?.src ?? '', owner);
  }
}

function textLength(file) {
  const $ = cheerio.load(readFileSync(file, 'utf8'));
  $('script, style, noscript').remove();
  return $('body').text().replace(/\s+/g, '').length;
}

function warnLargeTextDelta(record, owner) {
  if (!record.legacyPath?.startsWith('/speech/')) return;
  const source = path.join(root, record.legacyPath.replace(/^\//, ''));
  const built = path.join(dist, record.legacyPath.replace(/^\//, ''));
  if (!existsSync(source) || !existsSync(built)) return;

  const oldLength = textLength(source);
  const newLength = textLength(built);
  if (oldLength === 0 || newLength === 0) return;

  const ratio = Math.min(oldLength, newLength) / Math.max(oldLength, newLength);
  if (ratio < 0.3) {
    warnings.push(`${owner}: old/new page text length differs by more than 70% (${oldLength} -> ${newLength})`);
  }
}

for (const file of walk(contributionRoot)) {
  const record = parse(readFileSync(file, 'utf8'));
  const owner = relative(file);

  for (const field of ['id', 'legacyPath', 'type', 'date']) {
    if (!record?.[field]) errors.push(`${owner}: missing required field ${field}`);
  }
  if (!record?.title?.zh) errors.push(`${owner}: missing title.zh`);
  if (!record?.summary?.zh) warnings.push(`${owner}: summary.zh is empty`);

  if (record?.id) {
    if (ids.has(record.id)) errors.push(`${owner}: duplicate contribution id ${record.id}`);
    ids.add(record.id);
  }
  if (record?.legacyPath) {
    if (legacyPaths.has(record.legacyPath)) errors.push(`${owner}: duplicate legacyPath ${record.legacyPath}`);
    legacyPaths.add(record.legacyPath);
  }

  checkEvidence(record?.evidence, owner);
  warnLargeTextDelta(record, owner);
}

for (const file of walk(communityRoot)) {
  const record = parse(readFileSync(file, 'utf8'));
  const owner = relative(file);
  if (!record?.id) errors.push(`${owner}: missing id`);
  if (!record?.legacyPath) errors.push(`${owner}: missing legacyPath`);
  if (!record?.title?.zh) errors.push(`${owner}: missing title.zh`);

  for (const section of asArray(record?.sections)) {
    checkEvidence(section.evidence, `${owner}#${section.communityId ?? 'section'}`);
  }
}

if (warnings.length > 0) {
  console.warn(warnings.map((warning) => `Warning: ${warning}`).join('\n'));
}

if (errors.length > 0) {
  throw new Error(errors.join('\n'));
}

console.log(`Checked ${ids.size} contribution records and ${walk(communityRoot).length} community period records for proof readiness.`);
