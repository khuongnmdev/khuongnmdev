/**
 * Rasterizes the site icon, `public/icon.svg` (the monogram in the site's
 * dark palette and accent), into the formats browsers and phones ask for:
 *
 * - `public/favicon.ico`: 16, 32, and 48px PNGs with transparent corners,
 *   for browsers and tools that only look for the ICO;
 * - `public/apple-touch-icon.png`: 180px and full-bleed, since iOS rounds
 *   the corners itself.
 *
 * Browsers that support SVG icons use `icon.svg` directly. Run by hand after
 * changing the SVG, then commit the results:
 *
 *     node scripts/icons.mjs
 */
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { screenshots } from './chrome.mjs';

const publicDir = join(import.meta.dirname, '..', 'public');
const svg = readFileSync(join(publicDir, 'icon.svg'), 'utf8');
const svgUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

/** A page that draws the icon edge to edge, over `background`. */
function iconPage(size, background) {
  return `<!doctype html><html><body style="margin:0;background:${background}">
<img src="${svgUrl}" width="${size}" height="${size}" style="display:block" alt="">
</body></html>`;
}

/**
 * An ICO file holding the given PNGs. Every browser in use reads
 * PNG-compressed ICO entries, so the images go in unchanged.
 */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length + 16 * pngs.length;
  const entries = pngs.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width, 0 means 256
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // no palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pngs.map(({ data }) => data)]);
}

const FAVICON_SIZES = [16, 32, 48];
const temp = (size) => join(tmpdir(), `favicon-${process.pid}-${size}.png`);

screenshots(
  FAVICON_SIZES.map((size) => ({
    html: iconPage(size, 'transparent'),
    out: temp(size),
    width: size,
    height: size,
  })),
  { transparent: true },
);
const favicon = join(publicDir, 'favicon.ico');
writeFileSync(
  favicon,
  ico(FAVICON_SIZES.map((size) => ({ size, data: readFileSync(temp(size)) }))),
);
FAVICON_SIZES.forEach((size) => rmSync(temp(size)));
console.log(`Wrote ${favicon}`);

// Full bleed: the page background matches the icon's, so the SVG's rounded
// corners disappear and iOS applies its own mask.
const touchIcon = join(publicDir, 'apple-touch-icon.png');
screenshots([{ html: iconPage(180, '#060504'), out: touchIcon, width: 180, height: 180 }]);
console.log(`Wrote ${touchIcon}`);
