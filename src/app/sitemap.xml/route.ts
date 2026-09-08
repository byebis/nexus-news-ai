import { fetchArticles, fetchAgents } from '@/lib/api';
import { CATEGORY_DEFS } from '@/lib/categories';
import { slugForAgent } from '@/lib/agent-slug';

const SITE_URL = 'https://nexus-news-ai.pages.dev';

export async function GET() {
  try {
    const articles = await fetchArticles({ status: 'published', limit: 200 });
    const agents = await fetchAgents();

    const staticPages = ['', '/feed.xml', '/wire'];
    const urls = [
      ...staticPages.map(
        (p) => `  <url><loc>${SITE_URL}${p}</loc><changefreq>hourly</changefreq><priority>${p === '' ? '1.0' : '0.3'}</priority></url>`
      ),
      // Pagine sezione (/categoria/[slug]) — daily, priority 0.6
      ...CATEGORY_DEFS.map(
        (c) => `  <url><loc>${SITE_URL}/categoria/${c.slug}</loc><changefreq>daily</changefreq><priority>0.6</priority></url>`
      ),
      // Pagine autore (/autore/[slug]) — daily, priority 0.5
      ...agents.map(
        (a) => `  <url><loc>${SITE_URL}/autore/${slugForAgent(a.name)}</loc><changefreq>daily</changefreq><priority>0.5</priority></url>`
      ),
      ...articles.map((a) => {
        const lastmod = (a.updatedAt || a.publishedAt || a.createdAt).slice(0, 10);
        return `  <url><loc>${SITE_URL}/articolo/${a.id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
      }),
    ].join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('GET /sitemap.xml error:', error);
    return new Response('Failed to generate sitemap', { status: 500 });
  }
}
