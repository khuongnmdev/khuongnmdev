import { computed, inject, Injectable, signal } from '@angular/core';
import {
  DEFAULT_LOCALE,
  isLocale,
  type CvData,
  type Locale,
  type Profile,
  type SectionConfig,
  type SectionId,
  type UiStrings,
} from '@core/models/cv-data.model';
import { validateCvData } from '@core/validators/cv-data.validator';
import { CV_DATA } from '@data/cv-data';
import { CV_DATA_LOADERS } from '@data/cv-data.loaders';

/** Result of a `loadFrom` call. `errors` name the offending paths. */
export type LoadResult = { ok: true } | { ok: false; errors: string[] };

/**
 * Signal store over the CV dataset — the only place components read CV data
 * from. Because every consumer sits behind this service, swapping the data
 * source (another language, a user-uploaded file) touches no component.
 */
@Injectable({ providedIn: 'root' })
export class CvDataService {
  private readonly loaders = inject(CV_DATA_LOADERS);

  /**
   * Validated datasets per language. Promises rather than values, so two
   * requests for a language still loading share the one load.
   */
  private readonly cache = new Map<Locale, Promise<CvData>>();

  /**
   * Seeded with the eagerly bundled default-language dataset, so the store
   * has a value before the first route resolves; every route then passes its
   * language — this one included — through the validating loader.
   */
  private readonly state = signal<CvData>(CV_DATA);
  private readonly languageState = signal<Locale>(DEFAULT_LOCALE);

  /** Increments on every `useLanguage` call; only the latest may apply. */
  private languageRequest = 0;

  /** The full dataset, read-only. */
  readonly data = this.state.asReadonly();

  /** Language of the dataset in the store. */
  readonly language = this.languageState.asReadonly();

  readonly profile = computed<Profile>(() => this.data().profile);
  readonly ui = computed<UiStrings>(() => this.data().ui);

  /** Enabled sections in render order — drives the menu and the page layout. */
  readonly sections = computed<SectionConfig[]>(() =>
    this.data()
      .sections.filter((section) => section.enabled)
      .sort((a, b) => a.order - b.order),
  );

  /** The subset of `sections` that also appears in the A4 export. */
  readonly printSections = computed<SectionConfig[]>(() =>
    this.sections().filter((section) => section.showInPrint),
  );

  /**
   * Heading of a section: its `sections[]` title, or the interface's default
   * title for that id when the data carries no entry for it.
   */
  sectionTitle(id: SectionId): string {
    return (
      this.data().sections.find((section) => section.id === id)?.title ??
      this.ui().sectionTitles[id]
    );
  }

  /**
   * Makes `locale` the active language: loads its dataset on first use,
   * validates it, caches it, and puts it in the store. Rejects — leaving the
   * store untouched — when the load fails or the dataset is invalid.
   *
   * When calls overlap (a visitor switching languages twice in quick
   * succession), only the most recent one is applied, so a slow load that
   * finishes last can never overwrite the language asked for since.
   */
  async useLanguage(locale: Locale): Promise<void> {
    const request = ++this.languageRequest;
    const data = await this.datasetFor(locale);
    if (request === this.languageRequest) {
      this.state.set(data);
      this.languageState.set(locale);
    }
  }

  /**
   * Validates an untrusted payload and, when it passes, replaces the whole
   * store — and the language, when the payload declares a supported one. On
   * failure the current state is left untouched and the offending paths are
   * returned to the caller.
   */
  loadFrom(json: unknown): LoadResult {
    const result = validateCvData(json);
    if (!result.ok) {
      return { ok: false, errors: result.errors };
    }
    this.state.set(result.data);
    if (isLocale(result.data.meta.locale)) {
      this.languageState.set(result.data.meta.locale);
    }
    return { ok: true };
  }

  private datasetFor(locale: Locale): Promise<CvData> {
    const cached = this.cache.get(locale);
    if (cached) {
      return cached;
    }
    const pending = this.loaders[locale]().then((json) => {
      const result = validateCvData(json);
      if (!result.ok) {
        throw new Error(`The "${locale}" dataset is invalid: ${result.errors.join('; ')}`);
      }
      if (result.data.meta.locale !== locale) {
        throw new Error(
          `The "${locale}" dataset declares meta.locale "${result.data.meta.locale}"`,
        );
      }
      return result.data;
    });
    this.cache.set(locale, pending);
    // A failed load must not stay cached: the next request retries it.
    pending.catch(() => this.cache.delete(locale));
    return pending;
  }
}
