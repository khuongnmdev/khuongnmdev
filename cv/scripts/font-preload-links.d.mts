/** Types of `font-preload-links.mjs`, for the TypeScript unit tests that import it. */

export const ICON_FONTS: readonly string[];

export function iconFontFiles(files: readonly string[]): string[];

export function preloadLink(href: string): string;

export function injectFontPreloads(html: string, hrefs: readonly string[]): string;
