import { computed, Injectable, signal } from '@angular/core';
import type { CvData, Profile, SectionConfig, UiStrings } from '@core/models/cv-data.model';
import { validateCvData } from '@core/validators/cv-data.validator';
import { CV_DATA } from '@data/cv-data';
import { CV_DATA_VI } from '@data/cv-data.vi';

/** Result of a `loadFrom` call. `errors` name the offending paths. */
export type LoadResult = { ok: true } | { ok: false; errors: string[] };

/**
 * Signal store over the CV dataset — the only place components read CV data
 * from. Because every consumer sits behind this service, swapping the data
 * source (for example a user-uploaded file) touches no component.
 */
@Injectable({ providedIn: 'root' })
export class CvDataService {
  private readonly state = signal<CvData>(CV_DATA);
  private currentLanguage: 'en' | 'vi' = 'en';

  /** The full dataset, read-only, seeded from the bundled JSON. */
  readonly data = this.state.asReadonly();

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
   * Switches language by setting the state to the bundled data.
   */
  switchLanguage(): void {
    if (this.currentLanguage === 'en') {
      this.state.set(CV_DATA_VI);
      this.currentLanguage = 'vi';
    } else {
      this.state.set(CV_DATA);
      this.currentLanguage = 'en';
    }
  }

  /**
   * Validates an untrusted payload and, when it passes, replaces the whole
   * store. On failure the current state is left untouched and the offending
   * paths are returned to the caller.
   */
  loadFrom(json: unknown): LoadResult {
    const result = validateCvData(json);
    if (!result.ok) {
      return { ok: false, errors: result.errors };
    }
    this.state.set(result.data);
    this.currentLanguage = result.data.meta.locale === 'vi' ? 'vi' : 'en';
    return { ok: true };
  }
}
