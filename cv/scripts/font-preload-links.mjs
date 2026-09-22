/**
 * The pure half of the icon font preload step: finding the Font Awesome
 * webfonts in the build output and writing their preload links into a page.
 * No file or Node access here, so the unit tests can load it;
 * `font-preload.mjs` does the I/O.
 *
 * The prerendered pages inline their critical CSS and load the full
 * stylesheet asynchronously, so the browser only learns about the icon fonts
 * once that stylesheet has arrived and the icons are laid out. A preload link
 * in the head starts both downloads with the page instead. The file names
 * carry a content hash, so they are read back from the output rather than
 * written into `index.html` by hand.
 */

/**
 * The icon fonts the styles ship, by file stem: Font Awesome's solid and
 * brand styles, one woff2 file each. The `.ttf` fallbacks next to them are
 * never requested by a browser that preloads, so they get no link.
 */
export const ICON_FONTS = ['fa-solid-900', 'fa-brands-400'];

/** A Font Awesome woff2 file, with or without the build's content hash. */
const FONT_FILE = /(?:^|\/)(fa-[a-z]+-\d+)(?:-[A-Z0-9]+)?\.woff2$/;

/**
 * The woff2 file of each icon font among `files` (paths relative to the site
 * root, `/`-separated), in `ICON_FONTS` order. Throws unless each one is
 * there exactly once and no other Font Awesome woff2 file is: a font that was
 * renamed, added, or dropped must be looked at, never preloaded wrong.
 */
export function iconFontFiles(files) {
  const found = new Map(ICON_FONTS.map((font) => [font, []]));
  const unexpected = [];
  for (const file of files) {
    const match = FONT_FILE.exec(file);
    if (match) {
      (found.get(match[1]) ?? unexpected).push(file);
    }
  }
  const problems = [
    ...[...found]
      .filter(([, matches]) => matches.length !== 1)
      .map(([font, matches]) => `${font}: ${matches.length ? matches.join(', ') : 'none'}`),
    ...unexpected.map((file) => `unexpected ${file}`),
  ];
  if (problems.length) {
    throw new Error(
      `expected exactly one woff2 file for each of ${ICON_FONTS.join(', ')} ` +
        `(${problems.join('; ')})`,
    );
  }
  return ICON_FONTS.map((font) => found.get(font)[0]);
}

/**
 * The preload link of one font file. `crossorigin` is required even on the
 * same origin: fonts are fetched in CORS mode, and a preload made without it
 * would not match the stylesheet's request, so the font would load twice.
 */
export function preloadLink(href) {
  return `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin>`;
}

/**
 * `html` with a preload link for each of `hrefs`, right after the page's
 * `<base href>`: the hrefs are relative to it, and the earlier the links
 * sit in the head, the sooner the browser's preload scanner starts the
 * downloads. Throws on a page without a base href, and on one that already
 * preloads a font, so the step never runs twice over the same page.
 */
export function injectFontPreloads(html, hrefs) {
  const base = /<base\b[^>]*\bhref=[^>]*>/i.exec(html);
  if (!base) {
    throw new Error('no <base href> for the font URLs to resolve against');
  }
  if (/<link\b[^>]*\bas="font"/i.test(html)) {
    throw new Error('the page already preloads a font');
  }
  const end = base.index + base[0].length;
  const links = hrefs.map((href) => `\n  ${preloadLink(href)}`).join('');
  return html.slice(0, end) + links + html.slice(end);
}
