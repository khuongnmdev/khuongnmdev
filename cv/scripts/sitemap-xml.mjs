/**
 * The pure half of the sitemap step: reading the SEO signals out of a
 * prerendered page, and rendering the sitemap XML. No file or Node access
 * here, so the unit tests can load it; `sitemap.mjs` does the I/O.
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
 * what the app wrote into its head while prerendering.
 */
export function readPageSignals(html) {
  const links = tagsNamed(html, 'link');
  const robots = tagsNamed(html, 'meta').find((meta) => meta.name === 'robots');
  return {
    lang: tagsNamed(html, 'html')[0]?.lang,
    baseHref: tagsNamed(html, 'base')[0]?.href,
    canonical: links.find((link) => link.rel === 'canonical')?.href,
    robots: robots?.content,
    alternates: links
      .filter((link) => link.rel === 'alternate' && link.hreflang && link.href)
      .map((link) => ({ hreflang: link.hreflang, href: link.href })),
  };
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
