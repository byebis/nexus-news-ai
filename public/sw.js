/**
 * Nexus News AI — Service Worker (Level 8: lettura offline)
 *
 * Strategie:
 * - Navigazioni HTML (articoli, homepage): NETWORK-FIRST con fallback cache
 *   (le notizie devono essere fresche; se sei offline leggi l'ultima copia)
 * - Immagini (stessa origine + CDN esterne): CACHE-FIRST (foto stabili)
 * - Asset statici _next/static: CACHE-FIRST (immutabili, versionati da Next)
 *
 * La cache viene versionata e ripulita all'attivazione, con tetto massimo
 * di voci per non gonfiare lo storage del dispositivo.
 */

const VERSION = 'v1';
const HTML_CACHE = `nexus-html-${VERSION}`;
const IMG_CACHE = `nexus-img-${VERSION}`;
const ASSET_CACHE = `nexus-assets-${VERSION}`;
const MAX_ENTRIES = 60;

const OFFLINE_URLS = ['/', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(HTML_CACHE)
      .then((cache) => cache.addAll(OFFLINE_URLS))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = [HTML_CACHE, IMG_CACHE, ASSET_CACHE];
      const names = await caches.keys();
      await Promise.all(names.filter((n) => !keep.includes(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

/** Limita il numero di voci di una cache (FIFO). */
async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

function isImage(req) {
  return (
    req.destination === 'image' ||
    /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(new URL(req.url).pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Solo http(s) — salta estensioni, blob, ecc.
  if (!/^https?:$/.test(url.protocol)) return;

  // API: sempre rete, niente cache (dati dinamici)
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) return;

  // 1) Navigazioni HTML → network-first con fallback offline
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(HTML_CACHE);
          cache.put(req, fresh.clone());
          trimCache(HTML_CACHE, MAX_ENTRIES);
          return fresh;
        } catch {
          const cached = (await caches.match(req)) || (await caches.match('/'));
          if (cached) return cached;
          return new Response(
            '<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — Nexus News AI</title><body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#fafafa;color:#333"><div style="text-align:center"><div style="font-size:44px">📰</div><h1 style="font-size:18px;margin:8px 0">Sei offline</h1><p style="color:#777;font-size:14px">Gli articoli già visitati restano disponibili.<br/>RiConnetti per le ultime notizie.</p></div></body></html>',
            { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
          );
        }
      })(),
    );
    return;
  }

  // 2) Immagini → cache-first (anche cross-origin: CDN immagini)
  if (isImage(req)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          if (fresh.ok || fresh.type === 'opaque') {
            const cache = await caches.open(IMG_CACHE);
            cache.put(req, fresh.clone());
            trimCache(IMG_CACHE, MAX_ENTRIES * 2);
          }
          return fresh;
        } catch {
          return new Response('', { status: 504 });
        }
      })(),
    );
    return;
  }

  // 3) Asset statici stessa origine → cache-first
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/icons/') ||
      url.pathname === '/logo.svg')
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        const fresh = await fetch(req);
        if (fresh.ok) {
          const cache = await caches.open(ASSET_CACHE);
          cache.put(req, fresh.clone());
        }
        return fresh;
      })(),
    );
  }
});
