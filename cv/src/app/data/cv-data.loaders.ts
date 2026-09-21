import { InjectionToken } from '@angular/core';
import type { Locale } from '@core/models/cv-data.model';
import { CV_DATA } from './cv-data';

/**
 * One loader per supported language. A loader resolves to the raw dataset,
 * typed `unknown` on purpose: whatever it returns must pass the runtime
 * validator before it may enter the store.
 */
export type CvDataLoaders = Readonly<Record<Locale, () => Promise<unknown>>>;

/**
 * English is the default language and ships in the initial bundle. Every
 * other language is a dynamic `import()`, which the bundler splits into a
 * lazy chunk fetched only when that language's route activates — on the
 * server while prerendering, and in the browser before hydration.
 */
export const DEFAULT_CV_DATA_LOADERS: CvDataLoaders = {
  en: () => Promise.resolve(CV_DATA),
  vi: () => import('./cv-data.vi').then((module) => module.CV_DATA_VI),
};

/** Injectable so tests can observe when, and how often, a dataset is loaded. */
export const CV_DATA_LOADERS = new InjectionToken<CvDataLoaders>('CV_DATA_LOADERS', {
  providedIn: 'root',
  factory: () => DEFAULT_CV_DATA_LOADERS,
});
