import {
  ICON_FONTS,
  iconFontFiles,
  injectFontPreloads,
  preloadLink,
} from './font-preload-links.mjs';

/** What `ng build` writes to the browser output, minus the pages. */
const OUTPUT = [
  'chunk-D3MTVLDK.js',
  'favicon.ico',
  'main-L4Q565BS.js',
  'media/fa-brands-400-Q3XCMWHQ.woff2',
  'media/fa-brands-400-R2XQZCET.ttf',
  'media/fa-solid-900-5ZUYHGA7.woff2',
  'media/fa-solid-900-PJNKLK6W.ttf',
  'styles-53FSP22E.css',
];

const SOLID = 'media/fa-solid-900-5ZUYHGA7.woff2';
const BRANDS = 'media/fa-brands-400-Q3XCMWHQ.woff2';

describe('iconFontFiles', () => {
  it('finds the woff2 file of each icon font, in a fixed order', () => {
    expect(ICON_FONTS).toEqual(['fa-solid-900', 'fa-brands-400']);
    expect(iconFontFiles(OUTPUT)).toEqual([SOLID, BRANDS]);
    // Listing order does not matter.
    expect(iconFontFiles([...OUTPUT].reverse())).toEqual([SOLID, BRANDS]);
  });

  it('fails when an icon font is missing', () => {
    expect(() => iconFontFiles(OUTPUT.filter((file) => file !== BRANDS))).toThrow(
      /exactly one woff2 file .*fa-brands-400: none/,
    );
    // The .ttf fallback does not stand in for it.
    expect(() => iconFontFiles(['media/fa-solid-900-PJNKLK6W.ttf', BRANDS])).toThrow(
      /fa-solid-900: none/,
    );
    expect(() => iconFontFiles([])).toThrow(/fa-solid-900: none; fa-brands-400: none/);
  });

  it('fails when an icon font is there twice', () => {
    expect(() => iconFontFiles([...OUTPUT, 'media/fa-solid-900-AAAAAAAA.woff2'])).toThrow(
      /fa-solid-900: media\/fa-solid-900-5ZUYHGA7\.woff2, media\/fa-solid-900-AAAAAAAA\.woff2/,
    );
  });

  it('fails on a Font Awesome font it does not expect', () => {
    expect(() => iconFontFiles([...OUTPUT, 'media/fa-regular-400-BBBBBBBB.woff2'])).toThrow(
      /unexpected media\/fa-regular-400-BBBBBBBB\.woff2/,
    );
  });
});

describe('injectFontPreloads', () => {
  const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <base href="/khuongnmdev/">
  <link rel="stylesheet" href="styles-53FSP22E.css" media="print" onload="this.media='all'">
</head>
<body></body>
</html>`;

  function parse(html: string): Document {
    return new DOMParser().parseFromString(html, 'text/html');
  }

  it('adds one crossorigin font preload per file, right after the base href', () => {
    const document = parse(injectFontPreloads(page, [SOLID, BRANDS]));
    const preloads = Array.from(document.head.querySelectorAll('link[rel="preload"]'));
    expect(
      preloads.map((link) => [
        link.getAttribute('href'),
        link.getAttribute('as'),
        link.getAttribute('type'),
        link.hasAttribute('crossorigin'),
      ]),
    ).toEqual([
      [SOLID, 'font', 'font/woff2', true],
      [BRANDS, 'font', 'font/woff2', true],
    ]);
    // Behind the base href they resolve against, ahead of the stylesheet.
    expect(preloads[0].previousElementSibling?.tagName).toBe('BASE');
    expect(preloads[1].nextElementSibling?.getAttribute('rel')).toBe('stylesheet');
    // Everything else is left as it was.
    expect(injectFontPreloads(page, [SOLID]).replace(`\n  ${preloadLink(SOLID)}`, '')).toBe(page);
  });

  it('fails on a page without a base href', () => {
    expect(() => injectFontPreloads(page.replace(/<base[^>]*>/, ''), [SOLID])).toThrow(
      /no <base href>/,
    );
  });

  it('fails on a page that already preloads a font, so it never runs twice', () => {
    const once = injectFontPreloads(page, [SOLID, BRANDS]);
    expect(() => injectFontPreloads(once, [SOLID, BRANDS])).toThrow(/already preloads a font/);
  });
});
