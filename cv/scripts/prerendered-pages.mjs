/**
 * The pages the build prerendered, read back from the build output for the
 * post-build steps: every route of `prerendered-routes.json`, with its file
 * and the signals its HTML carries about itself.
 *
 * A prerendered route is one of two kinds. A page is what the app rendered,
 * with its language, base href, and head links. A redirect page is what the
 * prerenderer writes for a route the router redirects: a meta refresh to the
 * target and nothing else. Both are returned; `signals.redirect` tells them
 * apart.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readPageSignals } from './sitemap-xml.mjs';

/**
 * The prerendered pages under `distDir` (`dist/cv`), in the order of the
 * build's route list. Throws when the build has not run, or when a route has
 * no page file.
 */
export function readPrerenderedPages(distDir) {
  const routesFile = join(distDir, 'prerendered-routes.json');
  if (!existsSync(routesFile)) {
    throw new Error(`${routesFile} not found — run the build first.`);
  }
  const routes = Object.keys(JSON.parse(readFileSync(routesFile, 'utf8')).routes ?? {});
  return routes.map((route) => pageFor(join(distDir, 'browser'), route));
}

/**
 * The file of a prerendered route. Routes carry the base href
 * (`/khuongnmdev/vi`), files do not (`vi/index.html`): each shorter suffix
 * of the route is tried, and the one whose own `<base href>` plus its path
 * rebuilds the route is the page. A redirect page carries no base href; the
 * longest suffix with a file is taken for it.
 */
function pageFor(browserDir, route) {
  const segments = route.split('/').filter(Boolean);
  for (let start = 0; start <= segments.length; start++) {
    const dir = segments.slice(start).join('/');
    const file = join(browserDir, dir, 'index.html');
    if (!existsSync(file)) {
      continue;
    }
    const signals = readPageSignals(readFileSync(file, 'utf8'));
    if (signals.redirect !== undefined) {
      return { route, file, dir, signals };
    }
    const rebuilt = `${signals.baseHref ?? '/'}${dir}`.replace(/\/+$/, '');
    if (rebuilt === route.replace(/\/+$/, '')) {
      return { route, file, dir, signals };
    }
  }
  throw new Error(`no page file matches the prerendered route ${route}`);
}
