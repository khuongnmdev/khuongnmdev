/**
 * Turns the client-side app shell into the static files GitHub Pages needs
 * for the routes that are not prerendered.
 *
 * - `print/index.html` and `vi/print/index.html`: the client-rendered print
 *   preview of each language. With a file of its own the URL answers 200, so
 *   the export link on every page is no broken link for crawlers, and the
 *   injected `noindex` keeps it out of search indexes before the app boots
 *   (the app then keeps it that way). The shell carries no CV data, so the
 *   print-only contacts still reach no static HTML page, where crawlers
 *   would read them; they stay in the dataset the scripts load.
 * - `404.html`: what Pages serves, with a 404 status, for any unknown path;
 *   the app boots there and routes the visitor to the CV. Also `noindex`.
 *
 * The shell file itself is removed afterwards: Pages would otherwise serve it
 * as a thin duplicate of the site at its own URL, and the server bundle
 * embeds its own copy.
 *
 * Runs after `ng build` as part of the Pages build only; the shell already
 * carries the deployment base href at that point.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const browserDir = join(import.meta.dirname, '..', 'dist', 'cv', 'browser');
const shellFile = join(browserDir, 'index.csr.html');

/** The client-rendered pages of `src/app/app.routes.server.ts`, per language. */
const CLIENT_PAGES = ['print', 'vi/print'];

const NOINDEX = '<meta name="robots" content="noindex, nofollow">';

if (!existsSync(shellFile)) {
  console.error(`Client shell not found at ${shellFile} — run the build first.`);
  process.exit(1);
}

const shell = readFileSync(shellFile, 'utf8');
if (!shell.includes('</head>') || /<meta name="robots"/.test(shell)) {
  console.error('Unexpected client shell: no </head>, or a robots tag of its own.');
  process.exit(1);
}
const noindexShell = shell.replace('</head>', `  ${NOINDEX}\n</head>`);

for (const file of [...CLIENT_PAGES.map((page) => join(page, 'index.html')), '404.html']) {
  const target = join(browserDir, file);
  if (existsSync(target)) {
    console.error(`${target} already exists — a prerendered page must not be overwritten.`);
    process.exit(1);
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, noindexShell);
  console.log(`Wrote ${target}`);
}

rmSync(shellFile);
console.log(`Removed ${shellFile}`);
