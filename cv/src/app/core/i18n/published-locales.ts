import { InjectionToken } from '@angular/core';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@core/models/cv-data.model';

/**
 * The languages the site publishes. Vietnamese is paused: its dataset and
 * code stay in place, but no page, link, or search signal exposes it. To
 * publish it again, add 'vi' to this list.
 */
const PUBLISHED_SELECTION: readonly Locale[] = ['en'];

/**
 * The published languages, in the order of `SUPPORTED_LOCALES`, the default
 * language always among them. Everything public derives from this list: the
 * routes and the prerendered pages, the language switch, the `hreflang` and
 * `og:locale:alternate` signals, and, through the pages, the sitemap. A
 * supported language left out has no page of its own: its URLs lead to the
 * same page in the default language.
 */
export const PUBLISHED_LOCALES: readonly Locale[] = Object.freeze(
  SUPPORTED_LOCALES.filter(
    (locale) => locale === DEFAULT_LOCALE || PUBLISHED_SELECTION.includes(locale),
  ),
);

/**
 * `PUBLISHED_LOCALES` for components and services, which inject it rather
 * than import it, so a spec can render the site with another list.
 */
export const PUBLISHED_LOCALES_TOKEN = new InjectionToken<readonly Locale[]>('PUBLISHED_LOCALES', {
  providedIn: 'root',
  factory: () => PUBLISHED_LOCALES,
});
