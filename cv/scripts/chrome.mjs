/**
 * The installed Chrome's own headless screenshot mode, shared by the scripts
 * that render the site's images (social cards, icons) without adding an
 * image library. They run by hand, never in CI.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * The installed Chrome, looked up where each platform installs it. Set
 * CHROME_PATH to use another Chrome or Chromium executable.
 */
export function findChrome() {
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

/**
 * Renders each `{ html, out, width, height }` page to a PNG at `out`, at a
 * device scale of 1. With `transparent`, the page background stays clear
 * instead of white.
 */
export function screenshots(pages, { transparent = false } = {}) {
  const chrome = findChrome();
  const work = mkdtempSync(join(tmpdir(), 'site-images-'));
  try {
    pages.forEach(({ html, out, width, height }, index) => {
      const page = join(work, `${index}.html`);
      writeFileSync(page, html);
      // Removed first, so a Chrome that fails silently cannot leave an old
      // image in place looking like a fresh one.
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
          ...(transparent ? ['--default-background-color=00000000'] : []),
          `--user-data-dir=${join(work, 'profile')}`,
          `--window-size=${width},${height}`,
          `--screenshot=${out}`,
          pathToFileURL(page).href,
        ],
        { stdio: 'ignore' },
      );
      if (!existsSync(out)) {
        throw new Error(`Chrome wrote no screenshot to ${out}`);
      }
    });
  } finally {
    rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}
