/**
 * The pure half of the sitemap step: reading the SEO signals out of a
 * prerendered page, turning the indexable pages into sitemap entries, and
 * rendering the sitemap XML. No file or Node access here, so the unit tests
 * can load it; `sitemap.mjs` does the I/O.
 */

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" };

function decodeEntities(value) {
  return value.replace(/&(amp|lt|gt|quot|apos|#39);/g, (_, name) => ENTITIES[name]);
}

/** The attributes of every `<tag …>` in `html`, in document order. */
function tagsNamed(html, tag) {
  const tags = [];
  for (const match of html.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, 'gi'))) {
    const attributes = {};
    for (const attr of match[1].matchAll(/([^\s=/]+)\s*=\s*"([^"]*)"/g)) {
      attributes[attr[1].toLowerCase()] = decodeEntities(attr[2]);
    }
    tags.push(attributes);
  }
  return tags;
}

/**
 * The signals a prerendered page carries about itself: its language, base
 * href, canonical URL, robots policy, and `hreflang` alternates — exactly
 * what the app wrote into its head while prerendering. `redirect` is the
 * target of a meta refresh, which is all a redirect page carries.
 */
export function readPageSignals(html) {
  const links = tagsNamed(html, 'link');
  const metas = tagsNamed(html, 'meta');
  const robots = metas.find((meta) => meta.name === 'robots');
  const refresh = metas.find((meta) => meta['http-equiv']?.toLowerCase() === 'refresh');
  return {
    lang: tagsNamed(html, 'html')[0]?.lang,
    baseHref: tagsNamed(html, 'base')[0]?.href,
    canonical: links.find((link) => link.rel === 'canonical')?.href,
    robots: robots?.content,
    alternates: links
      .filter((link) => link.rel === 'alternate' && link.hreflang && link.href)
      .map((link) => ({ hreflang: link.hreflang, href: link.href })),
    ...(refresh
      ? { redirect: /url\s*=\s*(.*)$/i.exec(refresh.content ?? '')?.[1]?.trim() ?? '' }
      : {}),
  };
}

/**
 * The published languages, as the indexable pages tell them: the language
 * of each page, in page order, each once.
 */
export function publishedLanguages(pages) {
  return [...new Set(pages.map((page) => page.signals.lang))];
}

/**
 * One sitemap entry per indexable page, its URLs taken from the page itself.
 * With one published language a page names no `hreflang` alternates, since
 * they only pair pages across languages; with several, every page names each
 * published language plus `x-default`. A page that disagrees, or links
 * outside `siteUrl`, or is in a language no dataset dates (`updatedAt`, by
 * language), throws an error naming its file.
 */
export function sitemapEntries(pages, { siteUrl, published, updatedAt }) {
  const expected = published.length > 1 ? [...published, 'x-default'].sort() : [];
  return pages.map(({ file, signals }) => {
    if (!signals.canonical) {
      throw new Error(`${file} carries no canonical link`);
    }
    const hreflangs = signals.alternates.map((alternate) => alternate.hreflang).sort();
    if (hreflangs.join() !== expected.join()) {
      throw new Error(
        `${file} names the hreflang alternates [${hreflangs}], ` +
          `but the published languages [${published}] call for [${expected}]`,
      );
    }
    const urls = [signals.canonical, ...signals.alternates.map((alternate) => alternate.href)];
    if (!urls.every((url) => url.startsWith(siteUrl))) {
      throw new Error(`${file} links outside ${siteUrl}: ${urls.join(', ')}`);
    }
    const lastmod = updatedAt[signals.lang];
    if (!lastmod) {
      throw new Error(`no dataset declares the language "${signals.lang}" of ${file}`);
    }
    return { loc: signals.canonical, lastmod, alternates: signals.alternates };
  });
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/**
 * A sitemap listing `entries`, each with its language alternates as
 * `xhtml:link` elements — the sitemap form of `hreflang`.
 */
export function renderSitemap(entries) {
  const urls = entries.map((entry) =>
    [
      '  <url>',
      `    <loc>${escapeXml(entry.loc)}</loc>`,
      ...(entry.lastmod ? [`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`] : []),
      ...entry.alternates.map(
        (alternate) =>
          `    <xhtml:link rel="alternate" hreflang="${escapeXml(alternate.hreflang)}" href="${escapeXml(alternate.href)}"/>`,
      ),
      '  </url>',
    ].join('\n'),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}
