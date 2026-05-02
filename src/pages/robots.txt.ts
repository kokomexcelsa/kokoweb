import type { APIContext } from 'astro';

export function GET(_context: APIContext) {
  const site = _context.site ?? new URL('https://kokomexcelsa.github.io');
  const sitemapUrl = new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sitemap.xml`, site).toString();
  return new Response(
    ['User-agent: *', 'Allow: /', `Sitemap: ${sitemapUrl}`, ''].join('\n'),
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    }
  );
}
