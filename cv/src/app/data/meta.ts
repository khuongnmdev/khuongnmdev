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

/**
 * Canonical URL of the deployed site. Deployment configuration, not CV
 * content, so it stays a constant rather than living in the data file.
 */
const SITE_URL = 'https://khuongnmdev.github.io/khuongnmdev/';

/** Social preview image, produced by the deployment — not part of the data. */
const PREVIEW_IMAGE_URL = `${SITE_URL}preview.jpg`;

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

  return [
    { name: 'description', content: description },
    { name: 'author', content: profile.fullName },
    { name: 'keywords', content: keywords },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: siteUrlFor(locale) },
    { property: 'og:locale', content: OG_LOCALES[locale] },
    { property: 'og:image', content: PREVIEW_IMAGE_URL },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: PREVIEW_IMAGE_URL },
  ];
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
