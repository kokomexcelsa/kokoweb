import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const root = process.cwd();
const sourcePath = path.join(root, 'speech.html');
const outputRoot = path.join(root, 'content', 'contributions');
const speechRoot = path.join(root, 'speech');
const cjkPattern = /[\u3400-\u9fff]/;

const topicRules = [
  ['ai agent', 'AI Agent'],
  ['agent sdk', 'AI Agent'],
  ['tool call', 'Tool Calling'],
  ['llmops', 'LLMOps'],
  ['mlops', 'MLOps'],
  ['langchain', 'LangChain'],
  ['langserve', 'LangServe'],
  ['semantic kernel', 'Semantic Kernel'],
  ['prompt flow', 'Prompt Flow'],
  ['chatgpt', 'ChatGPT'],
  ['openai', 'OpenAI'],
  ['gemini', 'Gemini'],
  ['rag', 'RAG'],
  ['vector database', 'Vector Database'],
  ['qdrant', 'Qdrant'],
  ['notebooklm', 'NotebookLM'],
  ['generative ai', 'Generative AI'],
  ['生成式 ai', 'Generative AI'],
  ['automl', 'AutoML'],
  ['nni', 'NNI'],
  ['neural network intelligence', 'NNI'],
  ['machine learning', 'Machine Learning'],
  ['hyperparameter', 'Hyperparameter Tuning'],
  ['computer vision', 'Computer Vision'],
  ['yolo', 'YOLO'],
  ['bokeh', 'Bokeh'],
  ['python', 'Python'],
  ['chatbot', 'Chatbot'],
  ['line bot', 'LINE Bot'],
  ['nlp', 'NLP'],
  ['nlu', 'NLU']
];

const microsoftProductRules = [
  ['azure openai', 'Azure OpenAI'],
  ['azure ai', 'Azure AI'],
  ['azure machine learning', 'Azure Machine Learning'],
  ['azure ml', 'Azure Machine Learning'],
  ['azure cognitive', 'Azure Cognitive Services'],
  ['cognitive service', 'Azure Cognitive Services'],
  ['semantic kernel', 'Semantic Kernel'],
  ['prompt flow', 'Prompt Flow'],
  ['bot framework', 'Microsoft Bot Framework'],
  ['nni', 'Microsoft NNI'],
  ['neural network intelligence', 'Microsoft NNI'],
  ['azure', 'Microsoft Azure']
];

function textOf($, element) {
  return $(element).text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function yamlString(value) {
  return JSON.stringify(String(value ?? ''));
}

function yamlStringArray(values, indent = '') {
  if (!values.length) {
    return `${indent}[]`;
  }
  return values.map((value) => `${indent}- ${yamlString(value)}`).join('\n');
}

function normalizeLegacyDate(value) {
  const match = String(value ?? '').trim().match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (!match) {
    return '';
  }
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
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

function dedupe(values) {
  return [...new Set(values.filter(Boolean))];
}

function inferFormat(location) {
  const normalized = location.toLowerCase();
  if (
    normalized.includes('live stream') ||
    normalized.includes('online') ||
    normalized.includes('youtube') ||
    normalized.includes('bilibili') ||
    normalized.includes('twitch') ||
    location.includes('線上')
  ) {
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

function inferTags(text, rules) {
  const normalized = text.toLowerCase();
  return dedupe(rules.filter(([needle]) => normalized.includes(needle)).map(([, tag]) => tag));
}

function classifyLink(href, label) {
  const normalized = `${href} ${label}`.toLowerCase();
  if (normalized.includes('youtube') || normalized.includes('youtu.be') || normalized.includes('bilibili') || normalized.includes('vimeo')) {
    return 'recording';
  }
  if (
    normalized.includes('slideshare') ||
    normalized.includes('speakerdeck') ||
    normalized.includes('docs.google.com/presentation') ||
    normalized.includes('slides') ||
    normalized.includes('投影片')
  ) {
    return 'slides';
  }
  if (normalized.includes('github.com') || normalized.includes('hackmd.io')) {
    return 'article';
  }
  return 'link';
}

function classifyImage(src) {
  const normalized = src.toLowerCase();
  if (normalized.includes('/url-photos/') || normalized.includes('-url') || normalized.includes('url-')) {
    return 'screenshot';
  }
  return 'photo';
}

function linkKey(type, index, href) {
  if (type === 'recording') {
    return index === 0 ? 'recording' : `recording${index + 1}`;
  }
  if (type === 'slides') {
    return index === 0 ? 'slides' : `slides${index + 1}`;
  }
  if (type === 'article') {
    return href.includes('github.com') ? 'source' : index === 0 ? 'article' : `article${index + 1}`;
  }
  return index === 0 ? 'event' : `event${index + 1}`;
}

function extractDetail(item) {
  const detailPath = path.join(speechRoot, `${item.id}.html`);
  if (!existsSync(detailPath)) {
    return {
      title: { zh: item.title, en: cjkPattern.test(item.title) ? '' : item.title },
      isoDate: '',
      summary: { zh: '', en: '' },
      links: {},
      evidence: [],
      topics: inferTags(`${item.title} ${item.event}`, topicRules),
      microsoftProducts: inferTags(`${item.title} ${item.event}`, microsoftProductRules),
      hasDetail: false
    };
  }

  const detailHtml = readFileSync(detailPath, 'utf8');
  const $detail = cheerio.load(detailHtml);
  const isoDate = normalizeLegacyDate(textOf($detail, $detail('header .portfolio-title').first()));
  const boldTexts = $detail('#portfolio-speech p b')
    .toArray()
    .map((element) => textOf($detail, element).replace(/^Al agent/i, 'AI Agent'))
    .filter(Boolean);
  const englishTitle = boldTexts.find((value) => !cjkPattern.test(value));
  const zhTitle = boldTexts.find((value) => cjkPattern.test(value));
  const title = {
    zh: cjkPattern.test(item.title) ? item.title : zhTitle || item.title,
    en: cjkPattern.test(item.title) ? englishTitle || '' : item.title
  };

  const paragraphs = $detail('#portfolio-speech p')
    .toArray()
    .map((element) => textOf($detail, element))
    .filter((value) => {
      const normalized = value.replace(/^Al agent/i, 'AI Agent');
      return value.length > 20 && !boldTexts.includes(normalized);
    });
  const summary = {
    zh: paragraphs.filter((value) => cjkPattern.test(value)).join('\n\n'),
    en: paragraphs.filter((value) => !cjkPattern.test(value)).join('\n\n')
  };

  const links = {};
  const linkCounters = {};
  const evidence = [];

  $detail('#portfolio-speech a[href]').each((_, element) => {
    const href = normalizeUrl($detail(element).attr('href') ?? '', item.legacyPath);
    if (!/^https?:/.test(href)) {
      return;
    }
    const label = textOf($detail, element) || href;
    const type = classifyLink(href, label);
    const count = linkCounters[type] ?? 0;
    linkCounters[type] = count + 1;
    links[linkKey(type, count, href)] = href;
    evidence.push({
      type,
      href,
      label
    });
  });

  $detail('#portfolio-speech img[src]').each((_, element) => {
    const rawSrc = $detail(element).attr('src') ?? '';
    const src = normalizeUrl(rawSrc, item.legacyPath);
    const alt = $detail(element).attr('alt') || item.title;
    evidence.push({
      type: classifyImage(src),
      src,
      alt
    });
  });

  const fullText = [item.title, item.event, summary.zh, summary.en].join(' ');
  return {
    title,
    isoDate,
    summary,
    links,
    evidence,
    topics: inferTags(fullText, topicRules),
    microsoftProducts: inferTags(fullText, microsoftProductRules),
    hasDetail: true
  };
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

function serializeLinks(links) {
  const entries = Object.entries(links);
  if (!entries.length) {
    return ['links: {}'];
  }
  return ['links:', ...entries.map(([key, value]) => `  ${key}: ${yamlString(value)}`)];
}

function serializeEvidence(evidence) {
  if (!evidence.length) {
    return ['evidence: []'];
  }
  return [
    'evidence:',
    ...evidence.flatMap((item) => [
      `  - type: ${yamlString(item.type)}`,
      item.src ? `    src: ${yamlString(item.src)}` : null,
      item.href ? `    href: ${yamlString(item.href)}` : null,
      item.alt ? `    alt: ${yamlString(item.alt)}` : null,
      item.label ? `    label: ${yamlString(item.label)}` : null
    ].filter(Boolean))
  ];
}

function serializeContribution(item) {
  const detail = extractDetail(item);

  return [
    `id: ${yamlString(item.id)}`,
    `legacyPath: ${yamlString(item.legacyPath)}`,
    `type: ${yamlString(item.type)}`,
    `date: ${detail.isoDate || item.isoDate}`,
    'title:',
    `  zh: ${yamlString(detail.title.zh)}`,
    `  en: ${yamlString(detail.title.en)}`,
    `event: ${yamlString(item.event)}`,
    `location: ${yamlString(item.location)}`,
    'role: speaker',
    `format: ${yamlString(item.format)}`,
    'topics:',
    yamlStringArray(detail.topics, '  '),
    'microsoftProducts:',
    yamlStringArray(detail.microsoftProducts, '  '),
    ...serializeLinks(detail.links),
    ...serializeEvidence(detail.evidence),
    'summary:',
    `  zh: ${yamlString(detail.summary.zh)}`,
    `  en: ${yamlString(detail.summary.en)}`,
    'proofStatus:',
    '  importedFromList: ready',
    detail.hasDetail ? '  detailPage: found' : '  detailPage: missing',
    detail.evidence.length > 0 ? '  evidence: imported' : '  evidence: missing',
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
