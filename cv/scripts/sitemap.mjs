/**
 * Writes `sitemap.xml` to the root of the Pages artifact, served at the site
 * root (`/khuongnmdev/sitemap.xml`).
 *
 * It lists exactly the prerendered pages, taken from the build's
 * `prerendered-routes.json`, minus redirect pages and any page marked
 * `noindex`. Every URL comes from the page itself — its canonical link and
 * `hreflang` alternates, which the app wrote while prerendering — so the
 * sitemap can never disagree with the pages. The languages of those pages
 * are the published ones: with one, the sitemap names no alternates; with
 * several, each URL lists them all. `lastmod` is the `meta.updatedAt` of the
 * dataset in the page's language.
 *
 * Runs after `ng build` as part of the Pages build only. No robots.txt can
 * point at the file: crawlers read robots.txt only at the host root, which
 * this project site does not own, so the sitemap is submitted in the search
 * consoles instead.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { readPrerenderedPages } from './prerendered-pages.mjs';
import { publishedLanguages, renderSitemap, sitemapEntries } from './sitemap-xml.mjs';

const root = join(import.meta.dirname, '..');
const distDir = join(root, 'dist', 'cv');
const browserDir = join(distDir, 'browser');
const dataDir = join(root, 'src', 'app', 'data');

function fail(message) {
  console.error(`sitemap: ${message}`);
  process.exit(1);
}

const siteUrl = JSON.parse(readFileSync(join(dataDir, 'site.json'), 'utf8')).url;

/** `meta.updatedAt` of every dataset, by the language it declares. */
const updatedAt = Object.fromEntries(
  readdirSync(dataDir)
    .filter((name) => /^cv-data(\.[a-z]+)?\.json$/.test(name))
    .map((name) => JSON.parse(readFileSync(join(dataDir, name), 'utf8')).meta)
    .map((meta) => [meta.locale, meta.updatedAt]),
);

let pages;
try {
  pages = readPrerenderedPages(distDir);
} catch (error) {
  fail(error.message);
}

const indexable = pages.filter(({ file, signals }) => {
  if (signals.redirect !== undefined) {
    console.log(`Skipped ${relative(browserDir, file)}: redirects to ${signals.redirect}`);
    return false;
  }
  if (/\bnoindex\b/i.test(signals.robots ?? '')) {
    console.log(`Skipped ${relative(browserDir, file)}: noindex`);
    return false;
  }
  return true;
});
if (indexable.length === 0) {
  fail('no indexable prerendered page');
}

let entries;
try {
  entries = sitemapEntries(indexable, {
    siteUrl,
    published: publishedLanguages(indexable),
    updatedAt,
  });
} catch (error) {
  fail(error.message);
}

const out = join(browserDir, 'sitemap.xml');
writeFileSync(out, renderSitemap(entries));
console.log(`Wrote ${out} with ${entries.length} URLs`);
