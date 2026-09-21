import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import type { Locale, Profile, UiStrings } from '@core/models/cv-data.model';
import {
  buildAlternateLinks,
  buildMetaTags,
  buildOgLocaleAlternates,
  buildPageTitle,
  ROBOTS_INDEXABLE,
  siteUrlFor,
} from '@data/meta';

/**
 * Writes the document-level language signals: `<html lang>`, the title, the
 * description and social meta tags, the canonical link, and the `hreflang`
 * alternates. Only the injected `DOCUMENT` is touched, never `window`, so the
 * same code runs while prerendering and in the browser.
 */
@Injectable({ providedIn: 'root' })
export class PageMetaService {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  /**
   * Points the document at `locale`. Idempotent: every tag and link is
   * updated in place, so switching languages back and forth never leaves a
   * duplicate behind.
   */
  apply(locale: Locale, profile: Profile, ui: UiStrings): void {
    this.document.documentElement.setAttribute('lang', locale);
    this.title.setTitle(buildPageTitle(profile));
    for (const tag of buildMetaTags(profile, ui, locale)) {
      this.meta.updateTag(tag);
    }
    // Repeatable, so `updateTag` — which rewrites the first match — cannot
    // keep the set right; replace it whole.
    this.meta
      .getTags('property="og:locale:alternate"')
      .forEach((tag) => this.meta.removeTagElement(tag));
    this.meta.addTags(
      buildOgLocaleAlternates(locale).map((content) => ({
        property: 'og:locale:alternate',
        content,
      })),
    );
    // Robots is route policy (the print preview sets noindex), so it is only
    // seeded when missing — a language switch must not re-index that route.
    if (!this.meta.getTag('name="robots"')) {
      this.meta.addTag({ name: 'robots', content: ROBOTS_INDEXABLE });
    }
    this.upsertLink('link[rel="canonical"]', { rel: 'canonical' }, siteUrlFor(locale));
    for (const { hreflang, href } of buildAlternateLinks()) {
      this.upsertLink(
        `link[rel="alternate"][hreflang="${hreflang}"]`,
        { rel: 'alternate', hreflang },
        href,
      );
    }
  }

  /** Updates the `<head>` link matching `selector`, creating it on first use. */
  private upsertLink(selector: string, attributes: Record<string, string>, href: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>(selector);
    if (!link) {
      link = this.document.createElement('link');
      for (const [name, value] of Object.entries(attributes)) {
        link.setAttribute(name, value);
      }
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}
