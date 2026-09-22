/**
 * Preloads the two icon fonts from every page that renders icons: each
 * prerendered CV page and its print preview. Redirect pages render nothing,
 * and `404.html` only forwards the visitor to a page that has the links, so
 * neither gets them.
 *
 * The font files are read back from the build output (their names carry a
 * content hash), and each must be one the site's stylesheet asks for: a
 * preload the stylesheet never requests is a wasted download. Anything
 * unexpected — a font missing, doubled, renamed, or new, a page without its
 * print preview, a page already carrying the links — stops the build.
 *
 * Runs after `spa-fallback.mjs`, which writes the print previews, as part of
 * the Pages build only. Icon glyphs keep `font-display: block`: swapping
 * would flash their code points as fallback text.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { iconFontFiles, injectFontPreloads } from './font-preload-links.mjs';
import { readPrerenderedPages } from './prerendered-pages.mjs';

const distDir = join(import.meta.dirname, '..', 'dist', 'cv');
const browserDir = join(distDir, 'browser');

function fail(message) {
  console.error(`font-preload: ${message}`);
  process.exit(1);
}

let fonts;
let pages;
try {
  const files = readdirSync(browserDir, { recursive: true }).map((file) =>
    String(file).replaceAll('\\', '/'),
  );
  fonts = iconFontFiles(files);
  pages = readPrerenderedPages(distDir);
} catch (error) {
  fail(error.message);
}

const targets = pages
  .filter(({ signals }) => signals.redirect === undefined)
  .flatMap(({ dir }) => [join(dir, 'index.html'), join(dir, 'print', 'index.html')]);
if (targets.length === 0) {
  fail('no prerendered CV page to preload the fonts from');
}

for (const target of targets) {
  const file = join(browserDir, target);
  if (!existsSync(file)) {
    fail(`${file} not found — run spa-fallback.mjs first.`);
  }
  const html = readFileSync(file, 'utf8');
  const stylesheets = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((href, index, all) => all.indexOf(href) === index);
  const css = stylesheets.map((href) => readFileSync(join(browserDir, href), 'utf8')).join('\n');
  const unused = fonts.filter((font) => !css.includes(basename(font)));
  if (unused.length) {
    fail(`${relative(browserDir, file)}: its stylesheets never request ${unused.join(', ')}`);
  }
  try {
    writeFileSync(file, injectFontPreloads(html, fonts));
  } catch (error) {
    fail(`${relative(browserDir, file)}: ${error.message}`);
  }
  console.log(`Preloaded ${fonts.join(', ')} in ${relative(browserDir, file)}`);
}
