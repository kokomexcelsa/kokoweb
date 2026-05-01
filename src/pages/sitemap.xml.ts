import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { APIContext } from 'astro';

const site = 'https://kokomexcelsa.github.io';
const base = '/kokoweb';
type ContributionEntry = CollectionEntry<'contributions'>;
type CommunityEntry = CollectionEntry<'communityPeriods'>;

function absolute(path: string) {
  return `${site}${base}${path}`;
}

function urlNode(path: string, lastmod?: Date | string) {
  const date = lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : '';
  return `<url><loc>${absolute(path)}</loc>${date}</url>`;
}

export async function GET(_context: APIContext) {
  const contributions = (await getCollection('contributions')) as ContributionEntry[];
  const communityPeriods = (await getCollection('communityPeriods')) as CommunityEntry[];
  const staticUrls = [
    '/index.html',
    '/about.html',
    '/speech.html',
    '/contributions.html',
    '/mvp.html'
  ];

  const urls = [
    ...staticUrls.map((path) => urlNode(path)),
    ...contributions
      .filter((entry: ContributionEntry) => entry.data.legacyPath.startsWith('/speech/'))
      .map((entry: ContributionEntry) => urlNode(entry.data.legacyPath, entry.data.date)),
    ...communityPeriods
      .filter((entry: CommunityEntry) => entry.data.sitemap)
      .map((entry: CommunityEntry) => urlNode(entry.data.legacyPath, entry.data.period.end ?? `${entry.data.year}-12-31`))
  ];

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
}
