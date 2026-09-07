// RSS News Collector - real news sources for AI agents (no API keys needed)
// Works on Cloudflare Workers (fetch only, regex parsing - no XML lib)

export interface RssItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  image: string;
}

interface RssSource {
  url: string;
  name: string;
}

// Per-category sources (verified working Sep 2026)
const RSS_SOURCES: Record<string, RssSource[]> = {
  Tecnologia: [{ url: 'https://www.ansa.it/sito/notizie/tecnologia/tecnologia_rss.xml', name: 'ANSA Tecnologia' }],
  Politica: [{ url: 'https://www.ansa.it/sito/notizie/politica/politica_rss.xml', name: 'ANSA Politica' }],
  Economia: [{ url: 'https://www.ansa.it/sito/notizie/economia/economia_rss.xml', name: 'ANSA Economia' }],
  Scienza: [{ url: 'https://www.media.inaf.it/feed/', name: 'MEDIA INAF' }],
  Sport: [{ url: 'https://www.ansa.it/sito/notizie/sport/sport_rss.xml', name: 'ANSA Sport' }],
  Cultura: [{ url: 'https://www.ansa.it/sito/notizie/cultura/cultura_rss.xml', name: 'ANSA Cultura' }],
  Salute: [{ url: 'https://www.ansa.it/sito/ansait_rss.xml', name: 'ANSA' }],
};

// Universal fallback
const FALLBACK_SOURCE: RssSource = { url: 'https://www.ansa.it/sito/ansait_rss.xml', name: 'ANSA' };

function decodeCdata(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract the first plausible photo URL from a raw RSS <item> block.
 * Priority: media:content > media:thumbnail > enclosure > inline <img>.
 * Only https URLs of real photos (no icons/videos); WordPress thumbnail
 * variants (-150x150.jpg) are upgraded to the full-size original.
 */
const IMG_EXT = /\.(jpe?g|png|webp)(\?|$)/i;

function normalizeImageUrl(raw: string): string {
  let url = raw.trim().replace(/&amp;/g, '&');
  if (url.startsWith('//')) url = 'https:' + url;
  if (!url.startsWith('https://')) return '';
  // Upgrade WordPress size variants to the original file
  url = url.replace(/-\d{2,4}x\d{2,4}(\.jpe?g|\.png|\.webp)(\?|$)/i, '$1');
  return url;
}

function plausiblePhoto(url: string): boolean {
  if (!url) return false;
  if (/\.(svg|ico|gif)(\?|$)/i.test(url)) return false;
  // Site icons / logos / placeholders (e.g. ANSA precomposed banner icons)
  if (/(logo|icon|avatar|sprite|placeholder|precomposed|favicon|\/ico\/|\/img\/ico\/)/i.test(url)) return false;
  return IMG_EXT.test(url) || /image|photo|media|uploads|webimages/i.test(url);
}

function extractImageFromBlock(block: string): string {
  const candidates: string[] = [];
  // media:content / media:thumbnail (url attribute)
  const mediaRe = /<media:(?:content|thumbnail)[^>]*?url="([^"]+)"[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = mediaRe.exec(block))) {
    const tag = m[0];
    const type = tag.match(/type="([^"]+)"/i)?.[1] || '';
    if (!type || /^image\//i.test(type)) candidates.push(m[1]);
  }
  // enclosure (image/* only)
  const encRe = /<enclosure[^>]*?url="([^"]+)"[^>]*>/gi;
  while ((m = encRe.exec(block))) {
    const tag = m[0];
    const type = tag.match(/type="([^"]+)"/i)?.[1] || '';
    if (/^image\//i.test(type)) candidates.push(m[1]);
  }
  // inline <img> (typically inside content:encoded CDATA)
  const imgRe = /<img[^>]*?src="([^"]+)"/gi;
  while ((m = imgRe.exec(block))) candidates.push(m[1]);

  for (const c of candidates) {
    const url = normalizeImageUrl(c);
    if (url && plausiblePhoto(url)) return url;
  }
  return '';
}

function parseRss(xml: string, sourceName: string): RssItem[] {
  const items: RssItem[] = [];
  // RSS 2.0 <item> blocks
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const block of blocks) {
    const title = decodeCdata(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
    const description = decodeCdata(block.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '');
    const link = decodeCdata(block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '');
    const pubDate = decodeCdata(block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '');
    const image = extractImageFromBlock(block);
    if (title) items.push({ title, description, link, pubDate, source: sourceName, image });
  }
  // Atom <entry> fallback
  if (items.length === 0) {
    const entries = xml.match(/<entry[\s\S]*?<\/entry>/g) || [];
    for (const entry of entries) {
      const title = decodeCdata(entry.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || '');
      const description = decodeCdata(entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1] || '');
      const link = entry.match(/<link[^>]*href="([^"]+)"/)?.[1] || '';
      const pubDate = decodeCdata(entry.match(/<updated[^>]*>([\s\S]*?)<\/updated>/)?.[1] || '');
      const image = extractImageFromBlock(entry);
      if (title) items.push({ title, description, link, pubDate, source: sourceName, image });
    }
  }
  return items;
}

async function fetchOneSource(src: RssSource): Promise<RssItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(src.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NexusNewsAI/1.0; +https://nexus-news-ai.pages.dev)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    return parseRss(xml, src.name);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetch recent real news items for a category.
 * Tries category-specific sources first, then the fallback feed.
 * For 'Salute' (served by the general feed), keeps only health-related items.
 */
export async function fetchRssItems(category: string): Promise<{ items: RssItem[]; sourceName: string; errors: string[] }> {
  const errors: string[] = [];
  const sources = RSS_SOURCES[category] || [FALLBACK_SOURCE];

  for (const src of sources) {
    try {
      const items = await fetchOneSource(src);
      if (items.length > 0) {
        let filtered = items;
        if (category === 'Salute') {
          const kw = /salut|medicin|sanit|vaccin|ospedal|malatti|cura|farmac|virus|scoperta medica|nutrizion/i;
          const hit = items.filter(i => kw.test(i.title) || kw.test(i.description));
          if (hit.length > 0) filtered = hit;
        }
        // Most recent first when dates are present
        filtered = [...filtered].sort((a, b) => {
          const ta = Date.parse(a.pubDate) || 0;
          const tb = Date.parse(b.pubDate) || 0;
          return tb - ta;
        });
        return { items: filtered.slice(0, 8), sourceName: src.name, errors };
      }
      errors.push(`${src.name}: 0 items`);
    } catch (err: any) {
      errors.push(`${src.name}: ${err.message || String(err)}`);
    }
  }

  // Fallback feed
  try {
    const items = await fetchOneSource(FALLBACK_SOURCE);
    if (items.length > 0) {
      return { items: items.slice(0, 8), sourceName: FALLBACK_SOURCE.name, errors };
    }
    errors.push(`${FALLBACK_SOURCE.name}: 0 items`);
  } catch (err: any) {
    errors.push(`${FALLBACK_SOURCE.name}: ${err.message || String(err)}`);
  }

  return { items: [], sourceName: '', errors };
}
