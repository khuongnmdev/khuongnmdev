import { Injector, runInInjectionContext } from '@angular/core';
import type { CvData } from '@core/models/cv-data.model';
import { CvDataService } from '@core/services/cv-data.service';
import { CV_DATA } from '@data/cv-data';
import { CV_DATA_LOADERS, DEFAULT_CV_DATA_LOADERS } from '@data/cv-data.loaders';

/**
 * Test helpers for specs that need a `CvDataService` seeded with controlled
 * data. Kept outside the `*.spec.ts` naming so Vitest does not treat this
 * file as a suite of its own.
 */

/** Deep copy of the bundled dataset, safe for a test to mutate. */
export function cloneCvData(): CvData {
  return structuredClone(CV_DATA);
}

/**
 * A real `CvDataService` instance seeded with `data`, meant for a
 * `{ provide: CvDataService, useValue: ... }` test provider. Going through
 * `loadFrom` keeps every fixture honest: an invalid dataset fails loudly
 * instead of silently testing against impossible data.
 *
 * Built in a throwaway injector rather than the TestBed one, which a spec
 * has not configured yet at the point it calls this.
 */
export function cvDataServiceWith(data: CvData): CvDataService {
  const injector = Injector.create({
    providers: [{ provide: CV_DATA_LOADERS, useValue: DEFAULT_CV_DATA_LOADERS }],
  });
  const service = runInInjectionContext(injector, () => new CvDataService());
  const result = service.loadFrom(data);
  if (!result.ok) {
    throw new Error(`Test dataset is invalid: ${result.errors.join('; ')}`);
  }
  return service;
}
