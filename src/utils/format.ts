export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function labelForFormat(format: string): string {
  const labels: Record<string, string> = {
    'in-person': '實體',
    online: '線上',
    hybrid: '混合',
    published: '出版',
    other: '其他'
  };
  return labels[format] ?? format;
}

export function labelForType(type: string): string {
  const labels: Record<string, string> = {
    speaking: '演講',
    workshop: '工作坊',
    community: '社群',
    writing: '寫作',
    book: '出版',
    media: '媒體',
    'open-source': '開源',
    research: '研究',
    certification: '證照',
    mentoring: '指導'
  };
  return labels[type] ?? type;
}

export function labelForLink(key: string): string {
  const normalized = key.replace(/\d+$/, '');
  const labels: Record<string, string> = {
    event: '活動頁',
    recording: '錄影',
    slides: '投影片',
    article: '文章',
    source: '原始碼',
    profile: '公開頁面'
  };
  return labels[normalized] ?? key;
}

export function formatPeriod(start?: Date, end?: Date, fallbackYear?: number): string {
  if (start && end) return `${formatDate(start)} - ${formatDate(end)}`;
  if (start) return `${formatDate(start)} 起`;
  if (end) return `至 ${formatDate(end)}`;
  if (fallbackYear) return String(fallbackYear);
  return '總覽';
}

export function splitParagraphs(value = ''): string[] {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
