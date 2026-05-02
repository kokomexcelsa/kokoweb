import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const root = process.cwd();
const sourceRoot = path.join(root, 'community');
const outputRoot = path.join(root, 'content', 'community-periods');

function textOf($, element) {
  return $(element).text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function yamlString(value) {
  return JSON.stringify(String(value ?? ''));
}

function normalizeUrl(value, currentLegacyPath) {
  if (!value) {
    return '';
  }
  if (/^(https?:|mailto:|tel:)/.test(value)) {
    return value;
  }
  const baseDir = path.posix.dirname(currentLegacyPath);
  const joined = path.posix.normalize(path.posix.join(baseDir, value));
  return joined.startsWith('/') ? joined : `/${joined}`;
}

function slugify(value) {
  const ascii = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (ascii) {
    return ascii;
  }
  return Buffer.from(value).toString('hex').slice(0, 16);
}

function inferRole(title) {
  const normalized = title.toLowerCase();
  if (title.includes('管理') || title.includes('幹部') || normalized.includes('admin') || normalized.includes('core member')) {
    return 'admin';
  }
  if (title.includes('協辦') || title.includes('工作人員') || normalized.includes('staff')) {
    return 'staff';
  }
  if (normalized.includes('organizer') || title.includes('規畫')) {
    return 'organizer';
  }
  if (normalized.includes('bof')) {
    return 'facilitator';
  }
  return 'community contributor';
}

function parsePeriod(id, heading) {
  const range = heading.match(/(20\d{2})(\d{2})-(20\d{2})(\d{2})/);
  if (range) {
    const [, startYear, startMonth, endYear, endMonth] = range;
    const endDate = new Date(Number(endYear), Number(endMonth), 0);
    return {
      year: Number(endYear),
      start: `${startYear}-${startMonth}-01`,
      end: `${endYear}-${endMonth}-${String(endDate.getDate()).padStart(2, '0')}`
    };
  }

  const year = Number(id.match(/community-(20\d{2})/)?.[1] ?? heading.match(/20\d{2}/)?.[0] ?? 2019);
  return {
    year,
    start: `${year}-01-01`,
    end: `${year}-12-31`
  };
}

function removeGeneratedCommunityFiles(dir) {
  if (!existsSync(dir)) {
    return;
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      continue;
    }
    if (/^community(?:-\d{4})?\.ya?ml$/.test(entry.name)) {
      rmSync(absolute);
    }
  }
}

function serializeEvidence(evidence) {
  if (!evidence.length) {
    return ['    evidence: []'];
  }
  return [
    '    evidence:',
    ...evidence.flatMap((item) => [
      `      - type: ${yamlString(item.type)}`,
      item.src ? `        src: ${yamlString(item.src)}` : null,
      item.href ? `        href: ${yamlString(item.href)}` : null,
      item.alt ? `        alt: ${yamlString(item.alt)}` : null,
      item.label ? `        label: ${yamlString(item.label)}` : null
    ].filter(Boolean))
  ];
}

function serializePeriod(period) {
  return [
    `id: ${yamlString(period.id)}`,
    `legacyPath: ${yamlString(period.legacyPath)}`,
    `year: ${period.year}`,
    'period:',
    `  start: ${period.start}`,
    `  end: ${period.end}`,
    'title:',
    `  zh: ${yamlString(period.title)}`,
    '  en: ""',
    'sections:',
    ...period.sections.flatMap((section) => [
      `  - communityId: ${yamlString(section.communityId)}`,
      `    role: ${yamlString(section.role)}`,
      `    summary: ${yamlString(section.summary)}`,
      ...serializeEvidence(section.evidence),
      '    relatedContributionIds: []'
    ]),
    'sitemap: true',
    'noindex: false',
    ''
  ].join('\n');
}

function parseCommunityFile(fileName) {
  const id = path.basename(fileName, '.html');
  const legacyPath = `/community/${fileName}`;
  const html = readFileSync(path.join(sourceRoot, fileName), 'utf8');
  const $ = cheerio.load(html);
  const title = textOf($, $('header .portfolio-title').first()) || '社群活動規畫整理';
  const period = parsePeriod(id, title);
  const seen = new Set();
  const sections = [];

  $('#portfolio-speech .row.text-center').each((_, section) => {
    const heading = textOf($, $(section).find('h1.portfolio-title').first());
    const evidence = [];
    if (!heading || heading === '社群活動截圖') {
      return;
    }

    $(section).find('a[href]').each((_, anchor) => {
      const href = normalizeUrl($(anchor).attr('href') ?? '', legacyPath);
      if (!/^https?:/.test(href)) {
        return;
      }
      evidence.push({
        type: 'link',
        href,
        label: textOf($, anchor) || heading
      });
    });

    $(section).find('img[src]').each((_, image) => {
      const src = normalizeUrl($(image).attr('src') ?? '', legacyPath);
      evidence.push({
        type: 'screenshot',
        src,
        alt: $(image).attr('alt') || heading
      });
    });

    if (!evidence.length) {
      return;
    }

    const idSource = $(section).attr('id') || heading;
    const communityId = slugify(idSource);
    const dedupeKey = `${communityId}:${heading}`;
    if (seen.has(dedupeKey)) {
      return;
    }
    seen.add(dedupeKey);
    sections.push({
      communityId,
      role: inferRole(heading),
      summary: heading,
      evidence
    });
  });

  return {
    id,
    legacyPath,
    title,
    year: period.year,
    start: period.start,
    end: period.end,
    sections
  };
}

mkdirSync(outputRoot, { recursive: true });
removeGeneratedCommunityFiles(outputRoot);

const files = readdirSync(sourceRoot)
  .filter((file) => /^community(?:-\d{4})?\.html$/.test(file))
  .sort();
const periods = files.map(parseCommunityFile);

for (const period of periods) {
  writeFileSync(path.join(outputRoot, `${period.id}.yml`), serializePeriod(period));
}

console.log(`Imported ${periods.length} community period records from community/*.html.`);
