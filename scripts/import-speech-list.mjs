import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const root = process.cwd();
const sourcePath = path.join(root, 'speech.html');
const outputRoot = path.join(root, 'content', 'contributions');
const speechRoot = path.join(root, 'speech');

function textOf($, element) {
  return $(element).text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function yamlString(value) {
  return JSON.stringify(String(value ?? ''));
}

function inferFormat(location) {
  const normalized = location.toLowerCase();
  if (normalized.includes('live stream') || normalized.includes('online') || location.includes('線上')) {
    return 'online';
  }
  return 'in-person';
}

function inferType(title) {
  const normalized = title.toLowerCase();
  if (normalized.includes('workshop') || title.includes('工作坊')) {
    return 'workshop';
  }
  return 'speaking';
}

function removeGeneratedSpeechFiles(dir) {
  if (!existsSync(dir)) {
    return;
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeGeneratedSpeechFiles(absolute);
      if (readdirSync(absolute).length === 0) {
        rmSync(absolute, { recursive: true, force: true });
      }
      continue;
    }
    if (/^sp\d{4}-\d{2}-\d{2}(?:-\d+)?\.ya?ml$/.test(entry.name)) {
      rmSync(absolute);
    }
  }
}

function serializeContribution(item) {
  const hasDetail = existsSync(path.join(speechRoot, `${item.id}.html`));

  return [
    `id: ${yamlString(item.id)}`,
    `legacyPath: ${yamlString(item.legacyPath)}`,
    `type: ${yamlString(item.type)}`,
    `date: ${item.isoDate}`,
    'title:',
    `  zh: ${yamlString(item.title)}`,
    '  en: ""',
    `event: ${yamlString(item.event)}`,
    `location: ${yamlString(item.location)}`,
    'role: speaker',
    `format: ${yamlString(item.format)}`,
    'topics: []',
    'microsoftProducts: []',
    'links: {}',
    'evidence: []',
    'summary:',
    '  zh: ""',
    '  en: ""',
    'proofStatus:',
    '  importedFromList: ready',
    hasDetail ? '  detailPage: found' : '  detailPage: missing',
    '  evidence: pending',
    'language: mixed',
    ''
  ].join('\n');
}

const html = readFileSync(sourcePath, 'utf8');
const $ = cheerio.load(html);
const imported = [];

$('tr.clickable-row[data-href*="speech/sp"]').each((_, row) => {
  const href = $(row).attr('data-href') ?? '';
  const match = href.match(/speech\/(sp\d{4}-\d{2}-\d{2}(?:-\d+)?)\.html/);
  if (!match) {
    return;
  }

  const cells = $(row).children('th, td').toArray();
  const dateText = textOf($, cells[0]);
  const isoDate = dateText.replaceAll('/', '-');
  const title = textOf($, cells[1]);
  const event = textOf($, cells[2]);
  const location = textOf($, cells[3]);
  const id = match[1];

  imported.push({
    id,
    legacyPath: `/speech/${id}.html`,
    isoDate,
    title,
    event,
    location,
    type: inferType(title),
    format: inferFormat(location)
  });
});

const uniqueIds = new Set(imported.map((item) => item.id));
if (uniqueIds.size !== imported.length) {
  throw new Error(`Duplicate speech IDs detected: imported ${imported.length}, unique ${uniqueIds.size}`);
}

removeGeneratedSpeechFiles(outputRoot);

for (const item of imported) {
  const year = item.isoDate.slice(0, 4);
  const dir = path.join(outputRoot, year);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${item.id}.yml`), serializeContribution(item));
}

console.log(`Imported ${imported.length} speech contribution records from speech.html.`);
