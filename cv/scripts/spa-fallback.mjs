/**
 * Ships the client-side app shell as the GitHub Pages 404 page.
 *
 * Routes rendered on the client only have no static HTML of their own, so a
 * direct visit to one of them (or a reload) would get Pages' generic 404.
 * Pages serves `404.html` for any unknown path instead; with the shell in
 * that file the app boots and routes on the client, at the cost of an HTTP
 * 404 status — which also keeps search engines from indexing those paths.
 *
 * Runs after `ng build` as part of the Pages build only; the shell already
 * carries the deployment base href at that point.
 */
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const browserDir = join(import.meta.dirname, '..', 'dist', 'cv', 'browser');
const shell = join(browserDir, 'index.csr.html');
const fallback = join(browserDir, '404.html');

if (!existsSync(shell)) {
  console.error(`Client shell not found at ${shell} — run the build first.`);
  process.exit(1);
}

copyFileSync(shell, fallback);
console.log(`Copied ${shell} to ${fallback}`);
