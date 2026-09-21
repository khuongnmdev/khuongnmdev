/**
 * Renders the social preview card of every dataset — the image Facebook,
 * LinkedIn, X, and chat apps show for a shared link — to
 * `public/social-card-<locale>.png`, 1200×630 (the 1.91:1 large-card ratio).
 *
 * The card is built from the CV data: name, headline, city, and avatar, in
 * the site's dark palette with its accent, plus the site URL. Chrome's own
 * headless screenshot mode draws it, so no image library is needed.
 *
 * Run by hand after changing any of those fields, then commit the PNGs:
 *
 *     node scripts/social-card.mjs
 *
 * It needs a local Chrome (or Chromium); set CHROME_PATH when it is not
 * installed in the usual place. CI never runs it. Nothing time-sensitive —
 * such as years of experience — goes on the card, because the committed
 * image would go stale.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { delimiter, extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const WIDTH = 1200;
const HEIGHT = 630;

const root = join(import.meta.dirname, '..');
const dataDir = join(root, 'src', 'app', 'data');
const publicDir = join(root, 'public');

/** The installed Chrome, looked up where each platform installs it. */
function findChrome() {
  if (process.env.CHROME_PATH) {
    return process.env.CHROME_PATH;
  }
  const candidates = [];
  if (process.platform === 'win32') {
    for (const base of [
      process.env['PROGRAMFILES'],
      process.env['PROGRAMFILES(X86)'],
      process.env['LOCALAPPDATA'],
    ]) {
      if (base) {
        candidates.push(join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'));
      }
    }
  } else if (process.platform === 'darwin') {
    const app = join('Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome');
    candidates.push(join('/Applications', app), join(homedir(), 'Applications', app));
  } else {
    const names = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];
    for (const dir of (process.env.PATH ?? '').split(delimiter).filter(Boolean)) {
      candidates.push(...names.map((name) => join(dir, name)));
    }
  }
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error('Chrome not found. Set CHROME_PATH to the Chrome or Chromium executable.');
  }
  return found;
}

/** Escapes text for HTML content and double-quoted attributes. */
function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * The city of a `"City, Country"` location: everything before the last
 * comma, or the whole value when it has none.
 */
function cityOf(location) {
  const comma = location.lastIndexOf(',');
  return (comma === -1 ? location : location.slice(0, comma)).trim();
}

/** The avatar inlined as a data URL, so the page needs no file access. */
function avatarDataUrl(avatar) {
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  const type = types[extname(avatar).toLowerCase()];
  if (!type) {
    throw new Error(`Unsupported avatar type: ${avatar}`);
  }
  return `data:${type};base64,${readFileSync(join(publicDir, avatar)).toString('base64')}`;
}

/** Map-pin glyph, drawn inline so the card depends on no icon font. */
const PIN = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>`;

function cardHtml({ profile, meta }, siteUrl) {
  const city = profile.location ? cityOf(profile.location) : '';
  const url = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `<!doctype html>
<html lang="${escapeHtml(meta.locale)}">
<head>
<meta charset="utf-8">
<style>
  html, body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    background: #060504;
    color: #f3efe9;
    font-family: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Roboto, "Noto Sans", Arial, sans-serif;
  }
  .card {
    box-sizing: border-box;
    position: relative;
    display: flex;
    align-items: center;
    gap: 72px;
    width: 100%;
    height: 100%;
    padding: 0 88px 0 96px;
  }
  .card::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 14px;
    background: #f0690b;
  }
  .avatar {
    flex: none;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    border: 12px solid #f0690b;
    object-fit: cover;
  }
  .text { min-width: 0; }
  .name {
    margin: 0;
    font-size: 72px;
    font-weight: 700;
    line-height: 1.08;
    letter-spacing: -0.5px;
  }
  .headline {
    margin: 22px 0 0;
    color: #f0690b;
    font-size: 48px;
    font-weight: 600;
    line-height: 1.2;
  }
  .city {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 26px 0 0;
    color: #d9d4cd;
    font-size: 40px;
    line-height: 1.2;
  }
  .city svg { flex: none; width: 40px; height: 40px; color: #f0690b; }
  .url {
    margin: 40px 0 0;
    padding-top: 24px;
    border-top: 2px solid #3a3733;
    color: #b8b2aa;
    font-size: 34px;
    line-height: 1.2;
  }
</style>
</head>
<body>
  <main class="card">
    <img class="avatar" src="${avatarDataUrl(profile.avatar)}" alt="">
    <div class="text">
      <h1 class="name">${escapeHtml(profile.fullName)}</h1>
      <p class="headline">${escapeHtml(profile.headline)}</p>
      ${city ? `<p class="city">${PIN}<span>${escapeHtml(city)}</span></p>` : ''}
      <p class="url">${escapeHtml(url)}</p>
    </div>
  </main>
</body>
</html>
`;
}

/** Every dataset file in the data folder: `cv-data.json`, `cv-data.vi.json`, … */
function datasets() {
  return readdirSync(dataDir)
    .filter((name) => /^cv-data(\.[a-z]+)?\.json$/.test(name))
    .map((name) => JSON.parse(readFileSync(join(dataDir, name), 'utf8')));
}

const chrome = findChrome();
const siteUrl = JSON.parse(readFileSync(join(dataDir, 'site.json'), 'utf8')).url;
const work = mkdtempSync(join(tmpdir(), 'social-card-'));
try {
  for (const data of datasets()) {
    const page = join(work, `${data.meta.locale}.html`);
    const out = join(publicDir, `social-card-${data.meta.locale}.png`);
    writeFileSync(page, cardHtml(data, siteUrl));
    // Removed first, so a Chrome that fails silently cannot leave the old
    // card in place looking like a fresh one.
    rmSync(out, { force: true });
    execFileSync(
      chrome,
      [
        '--headless',
        '--disable-gpu',
        '--hide-scrollbars',
        '--no-first-run',
        '--no-default-browser-check',
        '--force-device-scale-factor=1',
        `--user-data-dir=${join(work, 'profile')}`,
        `--window-size=${WIDTH},${HEIGHT}`,
        `--screenshot=${out}`,
        pathToFileURL(page).href,
      ],
      { stdio: 'ignore' },
    );
    if (!existsSync(out)) {
      throw new Error(`Chrome wrote no screenshot for ${data.meta.locale}`);
    }
    console.log(`Wrote ${out}`);
  }
} finally {
  rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
