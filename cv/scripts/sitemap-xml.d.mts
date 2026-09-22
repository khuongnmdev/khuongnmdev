/** Types of `sitemap-xml.mjs`, for the TypeScript unit tests that import it. */

export interface Alternate {
  hreflang: string;
  href: string;
}

export interface PageSignals {
  lang?: string;
  baseHref?: string;
  canonical?: string;
  robots?: string;
  alternates: Alternate[];
  /** The meta refresh target; present only on a redirect page. */
  redirect?: string;
}

/** A prerendered page: its file, and what its HTML says about it. */
export interface Page {
  file: string;
  signals: PageSignals;
}

export interface SitemapEntry {
  loc: string;
  /** `YYYY-MM-DD`. */
  lastmod?: string;
  alternates: Alternate[];
}

export function readPageSignals(html: string): PageSignals;

export function publishedLanguages(pages: readonly Page[]): (string | undefined)[];

export function sitemapEntries(
  pages: readonly Page[],
  options: {
    siteUrl: string;
    published: readonly (string | undefined)[];
    /** `meta.updatedAt` of each dataset, by its language. */
    updatedAt: Readonly<Record<string, string>>;
  },
): SitemapEntry[];

export function renderSitemap(entries: readonly SitemapEntry[]): string;
