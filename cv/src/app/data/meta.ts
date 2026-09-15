import { MetaDefinition } from '@angular/platform-browser';
import type { Profile } from '@core/models/cv-data.model';

/**
 * Canonical URL of the deployed site. Deployment configuration, not CV
 * content, so it stays a constant rather than living in the data file.
 */
const SITE_URL = 'https://khuongnmdev.github.io/khuongnmdev/';

/** Social preview image, produced by the deployment — not part of the data. */
const PREVIEW_IMAGE_URL = `${SITE_URL}preview.jpg`;

/**
 * Default robots policy for the site. Exported so a route that must stay out
 * of search indexes can put this exact value back when it is left.
 */
export const ROBOTS_INDEXABLE = 'index, follow';

/** Document title: `"<name> — <headline>"`. */
export function buildPageTitle(profile: Profile): string {
  return `${profile.displayName ?? profile.fullName} — ${profile.headline}`;
}

/**
 * Meta tags derived from the profile, so a data edit updates SEO and social
 * previews along with the page. Only values that are not CV content — the
 * robots policy, `og:type`, the card type, and the deployment URLs — stay
 * hardcoded.
 */
export function buildMetaTags(profile: Profile): MetaDefinition[] {
  const title = buildPageTitle(profile);
  const description =
    `Resume of ${profile.fullName} — ${profile.headline}` +
    (profile.location ? `, based in ${profile.location}.` : '.');
  const keywords = [profile.fullName, profile.displayName, 'resume', 'CV', profile.headline]
    .filter((part): part is string => !!part)
    .join(', ');

  return [
    { name: 'description', content: description },
    { name: 'author', content: profile.fullName },
    { name: 'keywords', content: keywords },
    { name: 'robots', content: ROBOTS_INDEXABLE },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: SITE_URL },
    { property: 'og:image', content: PREVIEW_IMAGE_URL },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: PREVIEW_IMAGE_URL },
  ];
}
