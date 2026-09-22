# CV website

The Angular app behind Khuong Nguyen's online CV: one JSON file renders the web
page and the A4 PDF export, and the result is deployed to GitHub Pages as static
files.

Live site: <https://khuongnmdev.github.io/khuongnmdev/>

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Angular 22.1: standalone components, zoneless change detection, signal-first state, `OnPush` everywhere |
| Rendering | SSR and static prerender via `@angular/ssr`; the CV page is prerendered, the print route renders in the browser |
| UI | Bootstrap 5.3 (CSS only), Font Awesome 6 Free (solid and brands), self-hosted from `@fortawesome/fontawesome-free` |
| Styles | SCSS |
| Language | TypeScript 6.0, strict mode and strict templates |
| Tests | Vitest with jsdom, run by the Angular unit-test builder |
| Hosting | GitHub Actions to GitHub Pages |

## Requirements

- Node.js `^22.22.3 || ^24.15.0 || >=26.0.0`, the range Angular 22 supports.
  CI builds with Node 24.
- npm. The `packageManager` field pins `npm@11.17.0`.
- Google Chrome or Chromium, only for the two image scripts below.

## Getting started

Everything runs from the `cv/` folder.

```bash
cd cv
npm ci
npm start
```

The dev server listens on <http://localhost:4200/> and reloads on every change.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | `ng serve`: dev server with the development configuration |
| `npm run build` | `ng build`: production build with prerendering into `dist/cv/` (`browser/` static files, `server/` Node bundle), base href `/` |
| `npm run build-gh` | The GitHub Pages build: `ng build --base-href /khuongnmdev/`, then `scripts/spa-fallback.mjs` copies the client shell to `print/index.html` (one per published language) and `404.html`, all `noindex`, and removes `index.csr.html`, then `scripts/sitemap.mjs` writes `sitemap.xml` from the prerendered pages |
| `npm run watch` | Development build that rebuilds on every change |
| `npm test` | `ng test`: the Vitest unit tests, specs under `src/` and `scripts/` |
| `npm run serve:ssr:cv` | Runs the built Node SSR server, `dist/cv/server/server.mjs`, on <http://localhost:4000/> (`PORT` overrides it). Run `npm run build` first. Local only: Pages serves the static files |

Two scripts are run by hand, never in CI. Commit the images they write.

```bash
node scripts/social-card.mjs   # public/social-card-<locale>.png, 1200x630, one per dataset
node scripts/icons.mjs         # public/favicon.ico and public/apple-touch-icon.png from public/icon.svg
```

Run `social-card.mjs` after changing the name, headline, location, or avatar,
and `icons.mjs` after changing `public/icon.svg`. Both render with an installed
Chrome in headless mode; set `CHROME_PATH` to use another Chrome or Chromium
executable.

In Git Bash on Windows, a hand-typed `npx ng build --base-href /khuongnmdev/`
gets its path argument rewritten by MSYS. Use `npm run build-gh`, or set
`MSYS_NO_PATHCONV=1`.

## Project structure

```text
cv/
├── public/                  avatar, site icons, social cards
├── scripts/                 post-build steps and the image scripts
└── src/
    ├── app/
    │   ├── components/      the page sections, navigation, language switch, footer, print sheet
    │   ├── core/
    │   │   ├── i18n/        language routing and the published languages
    │   │   ├── models/      the CV data model
    │   │   ├── pipes/       date ranges, string templates
    │   │   ├── services/    CvDataService (the data store), page meta, print, theme, sidebar
    │   │   └── validators/  the runtime dataset validator
    │   ├── data/            cv-data.json, cv-data.vi.json, site.json
    │   ├── directives/      scroll spy for the active section
    │   └── pages/
    │       ├── main/        the CV page
    │       └── print/       the A4 preview and PDF export
    ├── styles.scss          global styles, light and dark palettes
    └── styles/print.scss    the A4 sheet
```

- [`src/app/data/cv-data.json`](src/app/data/cv-data.json) is the single source
  of truth. It holds content only: no colours, CSS classes, or styling.
- Components never import the JSON. They read it through `CvDataService`, a
  signal store, so the data source can change without touching a component.
- The build prerenders, so every `window` or `document` access is guarded with
  `isPlatformBrowser()`.
- Imports use the path aliases `@app/*`, `@core/*`, and `@data/*`.

## Editing the CV

Edit [`src/app/data/cv-data.json`](src/app/data/cv-data.json). Its shape is
defined in
[`src/app/core/models/cv-data.model.ts`](src/app/core/models/cv-data.model.ts).

- **Checks.** The build type-checks the JSON's structure: a missing required
  field or a value of the wrong type fails `npm run build`. Union values (a
  contact `type`, a section `id`, `employmentType`, skill `level`), date
  formats, and the `{placeholders}` of interface strings are checked by the
  runtime validator,
  [`src/app/core/validators/cv-data.validator.ts`](src/app/core/validators/cv-data.validator.ts),
  when a dataset loads. `npm test` runs it over both datasets.
- **Visibility.** Entries carry `showInWeb` and `showInPrint`; an omitted flag
  counts as `true`. `showInWeb: false` with `showInPrint: true` keeps an entry
  off the web page but in the PDF.
- **Sections.** `sections[]` drives the menu and the page: `order` sets the
  order, `enabled: false` hides a section, and `showInPrint: false` leaves it
  out of the PDF.
- **Dates.** `YYYY-MM`, with `endDate: null` while current. `meta.updatedAt`
  (`YYYY-MM-DD`) is the date in the page footer and the sitemap's `lastmod`, so
  bump it with every content edit.
- **Site URL.** [`src/app/data/site.json`](src/app/data/site.json) holds the
  deployed URL, used for the canonical link, the sitemap, and the social cards.

Keep [`src/app/data/cv-data.vi.json`](src/app/data/cv-data.vi.json) in sync with
every edit. The two files must stay structurally identical and differ only in
translatable wording; dates, flags, ids, order, and tech stacks must match.
[`src/app/data/cv-data.parity.spec.ts`](src/app/data/cv-data.parity.spec.ts)
fails `npm test` when they drift.

## Languages

English is published at `/`. The Vietnamese content exists but is currently
not published: nothing links to it, and its URLs under `/vi/` redirect to the
English pages.

To publish it, add `'vi'` to `PUBLISHED_SELECTION` in
[`src/app/core/i18n/published-locales.ts`](src/app/core/i18n/published-locales.ts).
`PUBLISHED_LOCALES` derives from that list, and the routes, prerendered pages,
language switch, `hreflang` links, and sitemap all follow it.

## PDF export

The `/print` route (`/khuongnmdev/print/` on the live site) previews the A4
sheet on screen. Its toolbar switches between the `classic` and `compact`
templates, kept in the URL as `?template=compact`, and **Export PDF** opens the
browser's print dialog once fonts and images have loaded: choose "Save as PDF".

The sheet has its own markup (`src/app/components/print-cv`), styled by the
global [`src/styles/print.scss`](src/styles/print.scss): Angular's view
encapsulation breaks `@page` rules inside component styles. The route renders
only in the browser and is `noindex`, because it shows the print-only contacts.

## Deployment

A push to `main` runs
[`.github/workflows/static.yml`](../.github/workflows/static.yml) (it can also
be started by hand from the Actions tab). The workflow installs with `npm ci`
on Node 24, runs `npm run build-gh`, and uploads `cv/dist/cv/browser` to GitHub
Pages.

The site is a project site, so the base href is `/khuongnmdev/`. The Node SSR
server is not deployed; Pages serves the prerendered and static files only.
