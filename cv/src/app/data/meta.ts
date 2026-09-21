import { MetaDefinition } from '@angular/platform-browser';
import { localeHomePath } from '@core/i18n/localized-url';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  type Profile,
  type UiStrings,
} from '@core/models/cv-data.model';
import { interpolate } from '@core/pipes/interpolate.pipe';
import site from './site.json';

/**
 * Canonical URL of the deployed site, with its trailing slash. Deployment
 * configuration, not CV content, so it lives in `site.json` rather than in
 * the CV data — a file the build scripts read as well.
 */
const SITE_URL = site.url;

/**
 * The social preview card of each language: generated from the CV data by
 * `scripts/social-card.mjs` into `public/social-card-<locale>.png` and
 * committed, so the image itself is not part of the data. Its size is fixed
 * by the generator at the 1.91:1 large-card ratio.
 */
const SOCIAL_CARD = { width: 1200, height: 630, type: 'image/png' } as const;

function socialCardUrl(locale: Locale): string {
  return `${SITE_URL}social-card-${locale}.png`;
}

/** Open Graph locale per language, in its `language_TERRITORY` form. */
const OG_LOCALES: Readonly<Record<Locale, string>> = {
  en: 'en_US',
  vi: 'vi_VN',
};

/**
 * Default robots policy for the site. Exported so a route that must stay out
 * of search indexes can put this exact value back when it is left.
 */
export const ROBOTS_INDEXABLE = 'index, follow';

/**
 * Absolute URL of a language's CV page: the site root for the default
 * language, its prefix below the root for every other one.
 */
export function siteUrlFor(locale: Locale): string {
  return `${SITE_URL}${localeHomePath(locale)}`;
}

/** Document title: `"<name> — <headline>"`. */
export function buildPageTitle(profile: Profile): string {
  return `${profile.displayName ?? profile.fullName} — ${profile.headline}`;
}

/**
 * Meta tags derived from the profile and the interface strings of `locale`,
 * so a data edit — or a language switch — updates SEO and social previews
 * along with the page. Only values that are not CV content — `og:type`, the
 * card type, and the deployment URLs — stay hardcoded. The robots policy is
 * deliberately absent: it belongs to the route, not to the language.
 */
export function buildMetaTags(profile: Profile, ui: UiStrings, locale: Locale): MetaDefinition[] {
  const title = buildPageTitle(profile);
  const description = profile.location
    ? interpolate(ui.metaDescription, {
        name: profile.fullName,
        headline: profile.headline,
        location: profile.location,
      })
    : interpolate(ui.metaDescriptionNoLocation, {
        name: profile.fullName,
        headline: profile.headline,
      });
  const keywords = [profile.fullName, profile.displayName, ui.metaKeywords, profile.headline]
    .filter((part): part is string => !!part)
    .join(', ');
  const image = socialCardUrl(locale);
  const imageAlt = interpolate(ui.socialImageAlt, {
    name: profile.fullName,
    headline: profile.headline,
  });

  return [
    { name: 'description', content: description },
    { name: 'author', content: profile.fullName },
    { name: 'keywords', content: keywords },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: siteUrlFor(locale) },
    { property: 'og:site_name', content: profile.displayName ?? profile.fullName },
    { property: 'og:locale', content: OG_LOCALES[locale] },
    // The image's own properties follow it, as Open Graph structures them.
    { property: 'og:image', content: image },
    { property: 'og:image:width', content: String(SOCIAL_CARD.width) },
    { property: 'og:image:height', content: String(SOCIAL_CARD.height) },
    { property: 'og:image:type', content: SOCIAL_CARD.type },
    { property: 'og:image:alt', content: imageAlt },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
    { name: 'twitter:image:alt', content: imageAlt },
  ];
}

/**
 * `og:locale:alternate` values: the Open Graph locale of every other
 * language the page exists in. A repeatable property, so the caller replaces
 * the whole set rather than updating one tag in place.
 */
export function buildOgLocaleAlternates(locale: Locale): string[] {
  return SUPPORTED_LOCALES.filter((other) => other !== locale).map((other) => OG_LOCALES[other]);
}

/**
 * `<link rel="alternate" hreflang>` targets: one absolute URL per language,
 * plus `x-default` pointing at the default language for everyone else.
 */
export function buildAlternateLinks(): { hreflang: string; href: string }[] {
  return [
    ...SUPPORTED_LOCALES.map((locale) => ({ hreflang: locale, href: siteUrlFor(locale) })),
    { hreflang: 'x-default', href: siteUrlFor(DEFAULT_LOCALE) },
  ];
}
