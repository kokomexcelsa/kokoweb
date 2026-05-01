import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { APIContext } from 'astro';
import legacyUrlManifest from '../../legacy-url-manifest.json';

type ContributionEntry = CollectionEntry<'contributions'>;
type CommunityEntry = CollectionEntry<'communityPeriods'>;
type LegacyUrlRecord = {
  path: string;
  sitemap?: boolean;
};

const legacyUrls = legacyUrlManifest as LegacyUrlRecord[];

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function absolute(path: string, site: URL) {
  return new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`, site).toString();
}

function urlNode(path: string, site: URL, lastmod?: Date | string) {
  const date = lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : '';
  return `<url><loc>${escapeXml(absolute(path, site))}</loc>${date}</url>`;
}

export async function GET(context: APIContext) {
  const site = context.site ?? new URL('https://kokomexcelsa.github.io');
  const contributions = (await getCollection('contributions')) as ContributionEntry[];
  const communityPeriods = (await getCollection('communityPeriods')) as CommunityEntry[];
  const extraGeneratedUrls = [
    '/about.html',
    '/contributions.html',
    '/mvp.html'
  ];
  const lastmodByPath = new Map<string, Date | string>();

  for (const entry of contributions) {
    if (entry.data.legacyPath.startsWith('/speech/')) {
      lastmodByPath.set(entry.data.legacyPath, entry.data.date);
    }
  }

  for (const entry of communityPeriods) {
    if (entry.data.period.end) {
      lastmodByPath.set(entry.data.legacyPath, entry.data.period.end);
    } else if (entry.data.year) {
      lastmodByPath.set(entry.data.legacyPath, `${entry.data.year}-12-31`);
    }
  }

  const sitemapPaths = [
    ...legacyUrls.filter((record) => record.sitemap).map((record) => record.path),
    ...extraGeneratedUrls
  ];
  const uniquePaths = [...new Set(sitemapPaths)];
  const urls = uniquePaths.map((path) => urlNode(path, site, lastmodByPath.get(path)));

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
}
