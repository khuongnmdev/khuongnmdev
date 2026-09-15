import type { CvData } from '@core/models/cv-data.model';
import { CvDataService } from '@core/services/cv-data.service';
import { CV_DATA } from '@data/cv-data';

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
 */
export function cvDataServiceWith(data: CvData): CvDataService {
  const service = new CvDataService();
  const result = service.loadFrom(data);
  if (!result.ok) {
    throw new Error(`Test dataset is invalid: ${result.errors.join('; ')}`);
  }
  return service;
}
