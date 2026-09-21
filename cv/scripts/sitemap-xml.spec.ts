import { readPageSignals, renderSitemap, type SitemapEntry } from './sitemap-xml.mjs';

const SITE = 'https://khuongnmdev.github.io/khuongnmdev/';

const ALTERNATES = [
  { hreflang: 'en', href: SITE },
  { hreflang: 'vi', href: `${SITE}vi/` },
  { hreflang: 'x-default', href: SITE },
];

const XHTML = 'http://www.w3.org/1999/xhtml';

function parse(xml: string): Document {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  expect(document.getElementsByTagName('parsererror')).toHaveLength(0);
  return document;
}

describe('renderSitemap', () => {
  const entries: SitemapEntry[] = [
    { loc: SITE, lastmod: '2026-09-15', alternates: ALTERNATES },
    { loc: `${SITE}vi/`, lastmod: '2026-09-14', alternates: ALTERNATES },
  ];

  it('lists every entry with its loc and lastmod in a well-formed urlset', () => {
    const document = parse(renderSitemap(entries));
    const urlset = document.documentElement;
    expect(urlset.localName).toBe('urlset');
    expect(urlset.namespaceURI).toBe('http://www.sitemaps.org/schemas/sitemap/0.9');
    const urls = Array.from(urlset.getElementsByTagName('url'));
    expect(urls.map((url) => url.getElementsByTagName('loc')[0].textContent)).toEqual([
      SITE,
      `${SITE}vi/`,
    ]);
    expect(urls.map((url) => url.getElementsByTagName('lastmod')[0].textContent)).toEqual([
      '2026-09-15',
      '2026-09-14',
    ]);
  });

  it('gives each entry its language alternates as xhtml:link elements', () => {
    const document = parse(renderSitemap(entries));
    for (const url of Array.from(document.getElementsByTagName('url'))) {
      const links = Array.from(url.getElementsByTagNameNS(XHTML, 'link'));
      expect(
        links.map((link) => [
          link.getAttribute('rel'),
          link.getAttribute('hreflang'),
          link.getAttribute('href'),
        ]),
      ).toEqual(ALTERNATES.map(({ hreflang, href }) => ['alternate', hreflang, href]));
    }
  });

  it('escapes XML special characters in URLs', () => {
    const loc = `${SITE}?a=1&b=<2>`;
    const xml = renderSitemap([{ loc, alternates: [{ hreflang: 'en', href: loc }] }]);
    expect(xml).toContain('?a=1&amp;b=&lt;2&gt;');
    const document = parse(xml);
    expect(document.getElementsByTagName('loc')[0].textContent).toBe(loc);
    expect(document.getElementsByTagNameNS(XHTML, 'link')[0].getAttribute('href')).toBe(loc);
    // No lastmod when the entry has none.
    expect(document.getElementsByTagName('lastmod')).toHaveLength(0);
  });
});

describe('readPageSignals', () => {
  const page = `<!doctype html>
<html lang="vi" data-beasties-container="">
<head>
  <base href="/khuongnmdev/">
  <meta name="description" content="CV">
  <meta name="robots" content="index, follow">
  <link rel="stylesheet" href="styles.css">
  <link rel="canonical" href="${SITE}vi/">
  <link rel="alternate" hreflang="en" href="${SITE}">
  <link rel="alternate" hreflang="vi" href="${SITE}vi/">
  <link rel="alternate" hreflang="x-default" href="${SITE}">
</head>
<body><a rel="alternate" href="/elsewhere">not a head link</a></body>
</html>`;

  it('reads the language, base href, canonical, robots, and hreflang alternates', () => {
    expect(readPageSignals(page)).toEqual({
      lang: 'vi',
      baseHref: '/khuongnmdev/',
      canonical: `${SITE}vi/`,
      robots: 'index, follow',
      alternates: ALTERNATES,
    });
  });

  it('reads attributes in any order and decodes entities', () => {
    const html = `<link href="${SITE}?a=1&amp;b=2" rel="canonical"><meta content="noindex, nofollow" name="robots">`;
    const signals = readPageSignals(html);
    expect(signals.canonical).toBe(`${SITE}?a=1&b=2`);
    expect(signals.robots).toBe('noindex, nofollow');
  });

  it('reports what a page lacks instead of inventing it', () => {
    expect(readPageSignals('<html><head></head></html>')).toEqual({
      lang: undefined,
      baseHref: undefined,
      canonical: undefined,
      robots: undefined,
      alternates: [],
    });
  });
});
