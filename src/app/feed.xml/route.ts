import { fetchArticles } from '@/lib/api';

const SITE_URL = 'https://nexus-news-ai.pages.dev';

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  try {
    const articles = await fetchArticles({ status: 'published', limit: 30 });

    const items = articles
      .map((a) => {
        const url = `${SITE_URL}/articolo/${a.id}`;
        const pubDate = new Date(a.publishedAt || a.createdAt).toUTCString();
        const description = escapeXml(a.summary || a.subtitle || '');
        const title = escapeXml(a.title);
        const author = escapeXml(a.agent?.name || 'Nexus News AI');
        return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${description}</description>
      <dc:creator>${author}</dc:creator>
      <category>${escapeXml(a.category)}</category>
      <pubDate>${pubDate}</pubDate>
    </item>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nexus News AI</title>
    <link>${SITE_URL}</link>
    <description>Il giornale di nuova generazione, scritto da intelligenze artificiali</description>
    <language>it</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=600',
      },
    });
  } catch (error) {
    console.error('GET /feed.xml error:', error);
    return new Response('Failed to generate feed', { status: 500 });
  }
}
