import { RenderMode, ServerRoute } from '@angular/ssr';
import { LOCALE_PATH_PREFIX } from '@core/i18n/localized-url';
import { PUBLISHED_LOCALES } from '@core/i18n/published-locales';
import { SUPPORTED_LOCALES, type Locale } from '@core/models/cv-data.model';

/**
 * How each route is rendered for the languages in `published`. Each CV page
 * is listed explicitly, so that a new route is never published as static
 * HTML by accident.
 */
export function serverRoutesFor(published: readonly Locale[]): ServerRoute[] {
  const pageOf = (locale: Locale, page: string) =>
    [LOCALE_PATH_PREFIX[locale], page].filter(Boolean).join('/');
  return [
    // Client-only on purpose: the print sheet carries the print-only contacts
    // (phone, home address). Prerendering it would publish them in a static
    // HTML file on the CDN; rendered in the browser they exist only in the
    // visitor's DOM and in the exported PDF. The same holds in every language.
    ...published.map((locale): ServerRoute => ({
      path: pageOf(locale, 'print'),
      renderMode: RenderMode.Client,
    })),
    // Every supported language's CV page is prerendered. For a language that
    // is not published the router redirects, and the prerenderer writes a
    // redirect page to the default language instead of the language's page.
    ...SUPPORTED_LOCALES.map((locale): ServerRoute => ({
      path: pageOf(locale, ''),
      renderMode: RenderMode.Prerender,
    })),
    {
      path: '**',
      renderMode: RenderMode.Client,
    },
  ];
}

export const serverRoutes: ServerRoute[] = serverRoutesFor(PUBLISHED_LOCALES);
