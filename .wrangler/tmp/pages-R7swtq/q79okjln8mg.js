// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: [
    "/*"
  ],
  exclude: [
    "/_next/static/*",
    "/favicon.ico",
    "/favicon.svg",
    "/logo.svg",
    "/robots.txt",
    "/manifest.json",
    "/icons/*",
    "/apple-icon*",
    "/icon*"
  ]
};

// node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "/home/z/my-project/.wrangler/tmp/pages-R7swtq/bundledWorker-0.19756944740667182.mjs";
import { isRoutingRuleMatch } from "/home/z/my-project/node_modules/wrangler/templates/pages-dev-util.ts";
export * from "/home/z/my-project/.wrangler/tmp/pages-R7swtq/bundledWorker-0.19756944740667182.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=q79okjln8mg.js.map
