import type { APIContext } from 'astro';

export function GET(_context: APIContext) {
  return new Response(
    ['User-agent: *', 'Allow: /', 'Sitemap: https://kokomexcelsa.github.io/kokoweb/sitemap.xml', ''].join('\n'),
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    }
  );
}
