/**
 * Writes `sitemap.xml` to the root of the Pages artifact, served at the site
 * root (`/khuongnmdev/sitemap.xml`).
 *
 * It lists exactly the prerendered pages, taken from the build's
 * `prerendered-routes.json`, minus any page marked `noindex`. Every URL comes
 * from the page itself — its canonical link and `hreflang` alternates, which
 * the app wrote while prerendering — so the sitemap can never disagree with
 * the pages. `lastmod` is the `meta.updatedAt` of the dataset in the page's
 * language.
 *
 * Runs after `ng build` as part of the Pages build only. No robots.txt can
 * point at the file: crawlers read robots.txt only at the host root, which
 * this project site does not own, so the sitemap is submitted in the search
 * consoles instead.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readPageSignals, renderSitemap } from './sitemap-xml.mjs';

const root = join(import.meta.dirname, '..');
const distDir = join(root, 'dist', 'cv');
const browserDir = join(distDir, 'browser');
const dataDir = join(root, 'src', 'app', 'data');

function fail(message) {
  console.error(`sitemap: ${message}`);
  process.exit(1);
}

const routesFile = join(distDir, 'prerendered-routes.json');
if (!existsSync(routesFile)) {
  fail(`${routesFile} not found — run the build first.`);
}
const routes = Object.keys(JSON.parse(readFileSync(routesFile, 'utf8')).routes ?? {});
const siteUrl = JSON.parse(readFileSync(join(dataDir, 'site.json'), 'utf8')).url;

/** `meta.updatedAt` of every dataset, by the language it declares. */
const updatedAt = new Map(
  readdirSync(dataDir)
    .filter((name) => /^cv-data(\.[a-z]+)?\.json$/.test(name))
    .map((name) => JSON.parse(readFileSync(join(dataDir, name), 'utf8')).meta)
    .map((meta) => [meta.locale, meta.updatedAt]),
);

/**
 * The file of a prerendered route. Routes carry the base href
 * (`/khuongnmdev/vi`), files do not (`vi/index.html`): each shorter suffix
 * of the route is tried, and the one whose own `<base href>` plus its path
 * rebuilds the route is the page.
 */
function pageFor(route) {
  const segments = route.split('/').filter(Boolean);
  for (let start = 0; start <= segments.length; start++) {
    const path = segments.slice(start).join('/');
    const file = join(browserDir, path, 'index.html');
    if (!existsSync(file)) {
      continue;
    }
    const html = readFileSync(file, 'utf8');
    const signals = readPageSignals(html);
    const rebuilt = `${signals.baseHref ?? '/'}${path}`.replace(/\/+$/, '');
    if (rebuilt === route.replace(/\/+$/, '')) {
      return { file, signals };
    }
  }
  return fail(`no page file matches the prerendered route ${route}`);
}

const entries = [];
for (const route of routes) {
  const { file, signals } = pageFor(route);
  if (/\bnoindex\b/i.test(signals.robots ?? '')) {
    console.log(`Skipped ${file}: noindex`);
    continue;
  }
  const urls = [signals.canonical, ...signals.alternates.map((alternate) => alternate.href)];
  if (!signals.canonical || signals.alternates.length === 0) {
    fail(`${file} carries no canonical link or no hreflang alternates`);
  }
  if (!urls.every((url) => url?.startsWith(siteUrl))) {
    fail(`${file} links outside ${siteUrl}: ${urls.join(', ')}`);
  }
  const lastmod = updatedAt.get(signals.lang);
  if (!lastmod) {
    fail(`no dataset declares the language "${signals.lang}" of ${file}`);
  }
  entries.push({ loc: signals.canonical, lastmod, alternates: signals.alternates });
}
if (entries.length === 0) {
  fail('no indexable prerendered page');
}

const out = join(browserDir, 'sitemap.xml');
writeFileSync(out, renderSitemap(entries));
console.log(`Wrote ${out} with ${entries.length} URLs`);
