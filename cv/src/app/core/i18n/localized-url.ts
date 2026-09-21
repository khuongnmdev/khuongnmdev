import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@core/models/cv-data.model';

/**
 * URL path prefix per language. The URL is the source of truth for the
 * language: the default language lives at the unprefixed paths (`/`,
 * `/print`), every other one under its prefix (`/vi`, `/vi/print`).
 */
export const LOCALE_PATH_PREFIX: Readonly<Record<Locale, string>> = {
  en: '',
  vi: 'vi',
};

/**
 * Absolute router commands for a page in `locale`:
 * `('vi', ['print'])` → `['/', 'vi', 'print']`, `('en', [])` → `['/']`.
 */
export function localizedCommands(locale: Locale, segments: readonly string[] = []): string[] {
  const prefix = LOCALE_PATH_PREFIX[locale];
  return ['/', ...(prefix ? [prefix] : []), ...segments];
}

/**
 * Splits a leading language prefix off URL path segments:
 * `['vi', 'print']` → `{ locale: 'vi', segments: ['print'] }`; segments with
 * no prefix belong to the default language.
 */
export function splitLocalePrefix(segments: readonly string[]): {
  locale: Locale;
  segments: string[];
} {
  const [first, ...rest] = segments;
  const prefixed = SUPPORTED_LOCALES.find(
    (locale) => LOCALE_PATH_PREFIX[locale] !== '' && LOCALE_PATH_PREFIX[locale] === first,
  );
  return prefixed
    ? { locale: prefixed, segments: rest }
    : { locale: DEFAULT_LOCALE, segments: [...segments] };
}

/**
 * Path of a language's home page relative to the site root, with the
 * trailing slash the static host redirects to: `''` or `'vi/'`.
 */
export function localeHomePath(locale: Locale): string {
  const prefix = LOCALE_PATH_PREFIX[locale];
  return prefix ? `${prefix}/` : '';
}
