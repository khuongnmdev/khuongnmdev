import { inject } from '@angular/core';
import { RedirectFunction, Route, Router, Routes } from '@angular/router';
import { MainComponent } from '@app/pages/main/main.component';
import { languageResolver } from '@core/i18n/language.resolver';
import { LOCALE_PATH_PREFIX, localizedCommands } from '@core/i18n/localized-url';
import { PUBLISHED_LOCALES } from '@core/i18n/published-locales';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@core/models/cv-data.model';

/** The pages every language serves; the language comes from the parent route. */
function localizedPages(): Routes {
  return [
    { path: '', component: MainComponent },
    {
      path: 'print',
      // Lazy on purpose: the print theme should not weigh down the initial
      // bundle of the page most visitors never print from.
      loadComponent: () =>
        import('@app/pages/print/print-page.component').then((module) => module.PrintPageComponent),
    },
  ];
}

/** A published language: its pages, activated once its dataset is in the store. */
function publishedLanguage(locale: Locale): Route {
  const prefix = LOCALE_PATH_PREFIX[locale];
  return {
    path: prefix,
    resolve: { language: languageResolver(locale) },
    children: prefix
      ? // A mistyped path under a language prefix stays in that language.
        [...localizedPages(), { path: '**', redirectTo: '' }]
      : localizedPages(),
  };
}

/**
 * The same page in the default language, for a URL under a language that is
 * not published: `/vi/print?template=compact` → `/print?template=compact`.
 * The query and the fragment are kept; a path the default language does not
 * serve then meets its own catch-all.
 */
const toDefaultLanguage: RedirectFunction = ({ url, queryParams, fragment }) =>
  inject(Router).createUrlTree(
    localizedCommands(
      DEFAULT_LOCALE,
      url.map((segment) => segment.path),
    ),
    { queryParams, fragment: fragment ?? undefined },
  );

/**
 * A supported language that is not published: nothing under its prefix
 * loads its dataset, and every URL there, the bare prefix included, leads to
 * the default language.
 */
function unpublishedLanguage(locale: Locale): Route {
  return {
    path: LOCALE_PATH_PREFIX[locale],
    children: [{ path: '**', redirectTo: toDefaultLanguage }],
  };
}

/**
 * The client routes for the languages in `published`. The default language
 * owns the unprefixed paths, so its empty prefix, which matches any URL,
 * comes after every prefixed language.
 */
export function localizedRoutes(published: readonly Locale[]): Routes {
  const locales = [...SUPPORTED_LOCALES].sort(
    (a, b) => Number(a === DEFAULT_LOCALE) - Number(b === DEFAULT_LOCALE),
  );
  return [
    ...locales.map((locale) =>
      published.includes(locale) ? publishedLanguage(locale) : unpublishedLanguage(locale),
    ),
    // Last on purpose: the static host serves the app shell for any unknown
    // path, so a mistyped or stale link must land on the CV rather than on an
    // empty outlet with a router error in the console.
    { path: '**', redirectTo: '' },
  ];
}

export const routes: Routes = localizedRoutes(PUBLISHED_LOCALES);
