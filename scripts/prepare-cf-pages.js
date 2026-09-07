const fs = require('fs');
const path = require('path');

const outputDir = path.resolve(__dirname, '../.open-next');

// 1. Copy static assets from assets/ subdirectory to output root
const assetsDir = path.join(outputDir, 'assets');
if (fs.existsSync(assetsDir)) {
  fs.cpSync(assetsDir, outputDir, { recursive: true, force: false });
  console.log('[prepare] Copied static assets to output root');
}

// 2. Generate a clean _worker.js WITHOUT Durable Object exports
// CF Pages does NOT support Durable Objects - they crash the worker
const workerContent = `
import { handleCdnCgiImageRequest, handleImageRequest } from "./cloudflare/images.js";
import { runWithCloudflareRequestContext } from "./cloudflare/init.js";
import { maybeGetSkewProtectionResponse } from "./cloudflare/skew-protection.js";
import { handler as middlewareHandler } from "./middleware/handler.mjs";

export default {
    async fetch(request, env, ctx) {
        return runWithCloudflareRequestContext(request, env, ctx, async () => {
            const response = maybeGetSkewProtectionResponse(request);
            if (response) {
                return response;
            }
            const url = new URL(request.url);
            if (url.pathname.startsWith("/cdn-cgi/image/")) {
                return handleCdnCgiImageRequest(url, env);
            }
            if (url.pathname ===
                \`${globalThis.__NEXT_BASE_PATH__}/_next/image\${globalThis.__TRAILING_SLASH__ ? "/" : ""}\`) {
                return await handleImageRequest(url, request.headers, env);
            }
            const reqOrResp = await middlewareHandler(request, env, ctx);
            if (reqOrResp instanceof Response) {
                return reqOrResp;
            }
            const { handler } = await import("./server-functions/default/handler.mjs");
            return handler(reqOrResp, env, ctx, request.signal);
        });
    },
};
`;

// 3. Generate _routes.json: static assets served directly by CF Pages CDN
// (bypassing worker) - WITHOUT this, CSS/JS requests hit the Next server handler and 404
const routesConfig = {
  version: 1,
  include: ['/*'],
  exclude: [
    '/_next/static/*',
    '/favicon.ico',
    '/favicon.svg',
    '/logo.svg',
    '/robots.txt',
    // '/sitemap.xml' NON escluso: ora e' una route dinamica (app/sitemap.xml/route.ts)
    '/manifest.json',
    '/sw.js',
    '/icons/*',
    '/apple-icon*',
    '/icon*',
  ],
};
fs.writeFileSync(path.join(outputDir, '_routes.json'), JSON.stringify(routesConfig, null, 2));
console.log('[prepare] Generated _routes.json (static assets bypass worker)');

fs.writeFileSync(path.join(outputDir, '_worker.js'), workerContent);
console.log('[prepare] Generated clean _worker.js (no Durable Objects)');
console.log('[prepare] Done! Output ready at .open-next/');
