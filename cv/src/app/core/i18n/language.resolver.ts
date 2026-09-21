import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import type { Locale } from '@core/models/cv-data.model';
import { CvDataService } from '@core/services/cv-data.service';

/**
 * Resolver for a language's parent route: activation waits until that
 * language's dataset is loaded, validated, and in the store. It runs the same
 * way while prerendering and in the browser, so the prerendered HTML and the
 * hydrating client render the same dataset.
 */
export function languageResolver(locale: Locale): ResolveFn<Locale> {
  return async () => {
    await inject(CvDataService).useLanguage(locale);
    return locale;
  };
}
