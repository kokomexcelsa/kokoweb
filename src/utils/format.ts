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

export function splitParagraphs(value = ''): string[] {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
