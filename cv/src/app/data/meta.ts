import { MetaDefinition } from '@angular/platform-browser';
import { localeHomePath } from '@core/i18n/localized-url';
import {
  DEFAULT_LOCALE,
  type ContactType,
  type CvData,
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

/** Robots policy of a route kept out of search indexes. */
export const ROBOTS_EXCLUDED = 'noindex, nofollow';

/**
 * Absolute URL of a language's CV page: the site root for the default
 * language, its prefix below the root for every other one.
 */
export function siteUrlFor(locale: Locale): string {
  return `${SITE_URL}${localeHomePath(locale)}`;
}

/**
 * Document title from the language's `pageTitle` template, filled with the
 * short name and the headline. Also the Open Graph and Twitter title.
 */
export function buildPageTitle(profile: Profile, ui: UiStrings): string {
  return interpolate(ui.pageTitle, {
    name: profile.displayName ?? profile.fullName,
    headline: profile.headline,
  });
}

/**
 * Meta tags derived from the profile and the interface strings of `locale`,
 * so a data edit — or a language switch — updates SEO and social previews
 * along with the page. Only values that are not CV content — `og:type`, the
 * card type, and the deployment URLs — stay hardcoded. The robots policy is
 * deliberately absent: it belongs to the route, not to the language.
 */
export function buildMetaTags(profile: Profile, ui: UiStrings, locale: Locale): MetaDefinition[] {
  const title = buildPageTitle(profile, ui);
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
 * published language, none when `locale` is the only one. A repeatable
 * property, so the caller replaces the whole set rather than updating one
 * tag in place.
 */
export function buildOgLocaleAlternates(locale: Locale, published: readonly Locale[]): string[] {
  return published.filter((other) => other !== locale).map((other) => OG_LOCALES[other]);
}

/** Contact types whose link is the same person's profile on another site. */
const PROFILE_LINK_TYPES: readonly ContactType[] = ['linkedin', 'github'];

/** How many skills the structured data lists as the person's expertise. */
const KNOWS_ABOUT_LIMIT = 10;

/**
 * Splits a `"City, Country"` location at its last comma. A value without a
 * comma is taken as the city alone.
 */
export function splitLocation(location: string): { locality: string; country?: string } {
  const comma = location.lastIndexOf(',');
  if (comma === -1) {
    return { locality: location.trim() };
  }
  return { locality: location.slice(0, comma).trim(), country: location.slice(comma + 1).trim() };
}

/**
 * schema.org `Person` for the page of `locale`, so search engines can tie
 * the page, the name in both scripts, and the linked profiles to one person.
 * Both languages share the `@id`: they describe the same entity.
 *
 * Privacy: only what the web page itself shows goes in — the coarse
 * `profile.location` rather than the postal address, and only web-visible
 * profile links. The phone, the address, and the birthday contacts are never
 * read here, whatever their visibility flags say.
 */
export function buildPersonJsonLd(data: CvData, locale: Locale): Record<string, unknown> {
  const { profile } = data;
  const alternateNames = [...new Set([profile.alternateName, profile.displayName])].filter(
    (name): name is string => !!name && name !== profile.fullName,
  );
  const sameAs = data.contacts
    .filter((contact) => contact.showInWeb !== false && PROFILE_LINK_TYPES.includes(contact.type))
    .map((contact) => contact.href)
    .filter((href): href is string => !!href && /^https?:\/\//.test(href));
  // A self-employed period names no organisation to work for.
  const employer = data.experience.find(
    (entry) => entry.current && entry.showInWeb !== false && entry.employmentType !== 'freelance',
  );
  const knowsAbout = [
    ...new Set(
      data.skills
        .filter((group) => group.showInWeb !== false)
        .flatMap((group) => group.items)
        .sort((a, b) => (b.level ?? 0) - (a.level ?? 0))
        .map((item) => item.name),
    ),
  ].slice(0, KNOWS_ABOUT_LIMIT);
  const place = profile.location ? splitLocation(profile.location) : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}#person`,
    name: profile.fullName,
    ...(alternateNames.length > 0 ? { alternateName: alternateNames } : {}),
    jobTitle: profile.headline,
    url: siteUrlFor(locale),
    image: new URL(profile.avatar, SITE_URL).href,
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(place
      ? {
          address: {
            '@type': 'PostalAddress',
            addressLocality: place.locality,
            ...(place.country ? { addressCountry: place.country } : {}),
          },
        }
      : {}),
    ...(employer
      ? {
          worksFor: {
            '@type': 'Organization',
            name: employer.company,
            ...(employer.companyUrl ? { url: employer.companyUrl } : {}),
          },
        }
      : {}),
    ...(knowsAbout.length > 0 ? { knowsAbout } : {}),
  };
}

/**
 * JSON for an inline `<script type="application/ld+json">`. Every `<` is
 * escaped, so no value — however it is written — can close the script
 * element early (`</script>`) or open a comment inside it.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/**
 * `<link rel="alternate" hreflang>` targets: one absolute URL per published
 * language, plus `x-default` pointing at the default language for everyone
 * else. None while only one language is published: such a page has no other
 * language to name, and its canonical link says the rest.
 */
export function buildAlternateLinks(
  published: readonly Locale[],
): { hreflang: string; href: string }[] {
  if (published.length < 2) {
    return [];
  }
  return [
    ...published.map((locale) => ({ hreflang: locale, href: siteUrlFor(locale) })),
    { hreflang: 'x-default', href: siteUrlFor(DEFAULT_LOCALE) },
  ];
}
