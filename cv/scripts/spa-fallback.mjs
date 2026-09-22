/**
 * Turns the client-side app shell into the static files GitHub Pages needs
 * for the routes that are not prerendered.
 *
 * - `print/index.html`, and `<prefix>/print/index.html` for every other
 *   published language: the client-rendered print preview of each published
 *   language. With a file of its own the URL answers 200, so the export link
 *   on every page is no broken link for crawlers, and the injected `noindex`
 *   keeps it out of search indexes before the app boots (the app then keeps
 *   it that way). The shell carries no CV data, so the print-only contacts
 *   still reach no static HTML page, where crawlers would read them; they
 *   stay in the dataset the scripts load.
 * - `404.html`: what Pages serves, with a 404 status, for any unknown path;
 *   the app boots there and routes the visitor to the CV. Also `noindex`.
 *
 * Each print preview sits one level below its language's CV page, so the
 * shells follow the CV pages the build prerendered. A language that is not
 * published has a redirect page there instead, and gets no print shell: its
 * print URL is answered by `404.html`, whose app sends the visitor on to the
 * default language's preview with the query kept, while the 404 status tells
 * crawlers the URL is gone. A static redirect could not keep the query.
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
import { readPrerenderedPages } from './prerendered-pages.mjs';

const distDir = join(import.meta.dirname, '..', 'dist', 'cv');
const browserDir = join(distDir, 'browser');
const shellFile = join(browserDir, 'index.csr.html');

const NOINDEX = '<meta name="robots" content="noindex, nofollow">';

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(shellFile)) {
  fail(`Client shell not found at ${shellFile} — run the build first.`);
}

const shell = readFileSync(shellFile, 'utf8');
if (!shell.includes('</head>') || /<meta name="robots"/.test(shell)) {
  fail('Unexpected client shell: no </head>, or a robots tag of its own.');
}
const noindexShell = shell.replace('</head>', `  ${NOINDEX}\n</head>`);

let pages;
try {
  pages = readPrerenderedPages(distDir);
} catch (error) {
  fail(error.message);
}

/** The client-rendered print preview of every published language. */
const printPages = pages
  .filter(({ signals }) => signals.redirect === undefined)
  .map(({ dir }) => join(dir, 'print'));
if (printPages.length === 0) {
  fail('No prerendered CV page to give a print preview.');
}

for (const file of [...printPages.map((page) => join(page, 'index.html')), '404.html']) {
  const target = join(browserDir, file);
  if (existsSync(target)) {
    fail(`${target} already exists — a prerendered page must not be overwritten.`);
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, noindexShell);
  console.log(`Wrote ${target}`);
}

rmSync(shellFile);
console.log(`Removed ${shellFile}`);
