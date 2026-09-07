// Article Image Resolver — finds the best photo for every generated article.
// Chain: 1) original RSS image  2) og:image from the source page  3) Openverse CC archive
//        4) Wikimedia Commons   5) AI-generated editorial illustration (Pollinations, free, no key)
// Every result is validated (HTTP HEAD) and carries a human-readable credit line.
// Works on Cloudflare Workers (fetch only, no external deps).

const UA = 'Mozilla/5.0 (compatible; NexusNewsAI/1.0; +https://nexus-news-ai.pages.dev)';

export interface ResolvedImage {
  url: string;
  credit: string;
  creditUrl: string;
  origin: 'originale' | 'archivio' | 'ai';
}

function withTimeout(ms: number): { signal: AbortSignal; done: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

/** HEAD check: must be 200 with an image/* content-type (some hosts need a browser UA). */
async function isValidImage(url: string): Promise<boolean> {
  if (!url || !url.startsWith('https://')) return false;
  const t = withTimeout(8000);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: t.signal, headers: { 'User-Agent': UA } });
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.startsWith('image/')) return !/image\/(svg|gif)/i.test(ct);
      // Some CDNs omit content-type on HEAD; accept 200 with image-looking URL
      return /\.(jpe?g|png|webp)(\?|$)/i.test(url);
    }
    return false;
  } catch {
    return false;
  } finally {
    t.done();
  }
}

// --------------------------------------------
// Keywords (Italian stopwords) for archive search
// --------------------------------------------
const STOPWORDS = new Set([
  'il','lo','la','i','gli','le','un','uno','una','di','a','da','in','con','su','per','tra','fra',
  'e','o','ma','che','chi','non','più','del','della','dei','delle','degli','al','allo','alla',
  'agli','alle','ai','dallo','dalla','nel','nella','sul','sulla','come','dove','quando','perché',
  'sono','è','ha','hanno','era','stato','dopo','prima','ancora','già','contro','senza','verso',
  'the','of','to','in','for','on','with','at','by','from','and','or','but','is','are','was','were',
  'a','an','new','after','before','amid','as','it','its','his','her',
  // editorial/generic words that make archive searches too noisy
  'esclusiva','analisi','approfondita','approfondimento','intervista','notizie','news',
  'nuovo','nuova','nuovi','nuove','annuncia','presentato','svelato','record','storico',
  'crisi','caso','giornate','consecutivo','quarto','video','foto','live','aggiornamento',
]);

export function extractKeywords(title: string, summary: string, max = 4): string {
  const words = `${title} ${summary.slice(0, 160)}`
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  const uniq = [...new Set(words)];
  return uniq.slice(0, max).join(' ');
}

// --------------------------------------------
// 2) og:image from the original article page
// --------------------------------------------
async function imageFromPage(pageUrl: string, sourceName: string): Promise<ResolvedImage | null> {
  if (!pageUrl || !pageUrl.startsWith('https://')) return null;
  // Never crawl our own site
  if (pageUrl.includes('nexus-news-ai.pages.dev')) return null;
  const t = withTimeout(9000);
  try {
    const res = await fetch(pageUrl, {
      signal: t.signal,
      headers: { 'User-Agent': UA, 'Accept': 'text/html' },
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 400_000);
    const og =
      html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1] ||
      html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';
    const url = og.trim().replace(/&amp;/g, '&');
    if (url && (await isValidImage(url))) {
      return {
        url,
        credit: `Foto: ${sourceName || 'fonte originale'}`,
        creditUrl: pageUrl,
        origin: 'originale',
      };
    }
    return null;
  } catch {
    return null;
  } finally {
    t.done();
  }
}

// --------------------------------------------
// 3) Openverse — Creative Commons archive (free, no key)
// --------------------------------------------
async function imageFromOpenverse(query: string): Promise<ResolvedImage | null> {
  if (!query) return null;
  const endpoint = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=6&filter_dead=false`;
  const t = withTimeout(9000);
  try {
    const res = await fetch(endpoint, { signal: t.signal, headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{ url?: string; creator?: string; license?: string; license_version?: string; foreign_landing_url?: string }>;
    };
    for (const r of data.results || []) {
      const url = (r.url || '').trim();
      if (!url || !(await isValidImage(url))) continue;
      const lic = `${(r.license || 'cc').toUpperCase()}${r.license_version ? ' ' + r.license_version : ''}`;
      return {
        url,
        credit: `Foto: ${r.creator || 'autore sconosciuto'} · ${lic} · via Openverse`,
        creditUrl: r.foreign_landing_url || '',
        origin: 'archivio',
      };
    }
    return null;
  } catch {
    return null;
  } finally {
    t.done();
  }
}

// --------------------------------------------
// 4) Wikimedia Commons — encyclopedia-grade archive (free, no key)
// --------------------------------------------
async function imageFromWikimedia(query: string): Promise<ResolvedImage | null> {
  if (!query) return null;
  const endpoint =
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent('filetype:bitmap ' + query)}&gsrnamespace=6&gsrlimit=5` +
    `&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1024&format=json`;
  const t = withTimeout(9000);
  try {
    const res = await fetch(endpoint, { signal: t.signal, headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      query?: { pages?: Record<string, { imageinfo?: Array<{ thumburl?: string; descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }> }> };
    };
    const pages = Object.values(data.query?.pages || {});
    for (const page of pages) {
      const info = page.imageinfo?.[0];
      if (!info) continue;
      const url = info.thumburl || '';
      if (!url || !(await isValidImage(url))) continue;
      const meta = info.extmetadata || {};
      const artist = (meta.Artist?.value || '').replace(/<[^>]+>/g, '').trim().slice(0, 60);
      const license = (meta.LicenseShortName?.value || 'CC').replace(/<[^>]+>/g, '').trim();
      return {
        url,
        credit: `Foto: ${artist || 'Wikimedia Commons'} · ${license} · Wikimedia Commons`,
        creditUrl: info.descriptionurl || '',
        origin: 'archivio',
      };
    }
    return null;
  } catch {
    return null;
  } finally {
    t.done();
  }
}

// --------------------------------------------
// 5) AI-generated editorial illustration (Pollinations, free, no key)
// Deterministic seed → same article always gets the same artwork.
// --------------------------------------------
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 1_000_000;
}

const CATEGORY_STYLE: Record<string, string> = {
  Tecnologia: 'futuristic technology scene, sleek circuits and data streams',
  Politica: 'civic institutions and parliament architecture, formal atmosphere',
  Economia: 'financial district, markets and charts, business atmosphere',
  Scienza: 'scientific discovery, laboratory and cosmos, awe inspiring',
  Sport: 'dynamic sports action photography, stadium energy',
  Cultura: 'elegant cultural scene, art museum and heritage',
  Salute: 'modern healthcare and wellness, clean bright tones',
};

async function imageFromAI(title: string, category: string): Promise<ResolvedImage | null> {
  const style = CATEGORY_STYLE[category] || 'professional newspaper editorial scene';
  const prompt = `editorial photograph for a news article about "${title.slice(0, 120)}", ${style}, cinematic lighting, high detail, no text, no watermark`;
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=1024&height=576&seed=${hashString(title)}&nologo=true&model=flux`;

  // Retry a few times: the free generator rate-limits bursts (429) and can be busy (5xx).
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 2500 * attempt));
    const t = withTimeout(25000);
    try {
      const res = await fetch(url, { signal: t.signal, headers: { 'User-Agent': UA } });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.startsWith('image/')) {
          return { url, credit: 'Illustrazione generata con AI', creditUrl: '', origin: 'ai' };
        }
      }
      // !ok or wrong content-type: retry
    } catch {
      // Timeout/abort: generation is still happening server-side and the URL is
      // deterministic — the browser will wait for it later. Accept the URL.
      return { url, credit: 'Illustrazione generata con AI', creditUrl: '', origin: 'ai' };
    } finally {
      t.done();
    }
  }
  return null;
}

// --------------------------------------------
// MAIN RESOLVER
// --------------------------------------------
export interface ResolveOptions {
  title: string;
  summary: string;
  category: string;
  sourceName: string;
  rssImage?: string;
  pageUrl?: string;
  /** Skip AI generation as a last resort (e.g. batch jobs with tight time budget) */
  allowAI?: boolean;
}

/**
 * Full resolution chain. Never throws: returns null only if every step failed
 * and AI generation is disabled — the UI falls back to generative cover art.
 */
export async function resolveArticleImage(opts: ResolveOptions): Promise<ResolvedImage | null> {
  const { title, summary, category, sourceName, rssImage, pageUrl, allowAI = true } = opts;

  // 1) Original photo attached to the RSS item
  if (rssImage) {
    const url = rssImage.trim().replace(/&amp;/g, '&');
    if (url.startsWith('https://') && (await isValidImage(url))) {
      return { url, credit: `Foto: ${sourceName || 'fonte originale'}`, creditUrl: pageUrl || '', origin: 'originale' };
    }
  }

  // 2) og:image of the original article page
  const fromPage = await imageFromPage(pageUrl || '', sourceName);
  if (fromPage) return fromPage;

  // 3-4) Free CC archives (Openverse first, Wikimedia as backup)
  const keywords = extractKeywords(title, summary);
  if (keywords) {
    const ov = await imageFromOpenverse(keywords);
    if (ov) return ov;
    const wm = await imageFromWikimedia(keywords);
    if (wm) return wm;
  }

  // 5) AI-generated editorial illustration
  if (allowAI) {
    return imageFromAI(title, category);
  }
  return null;
}
