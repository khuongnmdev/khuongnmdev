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
}

export interface SitemapEntry {
  loc: string;
  /** `YYYY-MM-DD`. */
  lastmod?: string;
  alternates: Alternate[];
}

export function readPageSignals(html: string): PageSignals;

export function renderSitemap(entries: readonly SitemapEntry[]): string;
