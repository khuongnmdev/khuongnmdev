import type { CvData } from '@core/models/cv-data.model';
import cvDataJson from './cv-data.json';

/**
 * Widens literal unions back to their base types, recursively.
 *
 * TypeScript widens every string in a JSON import to `string`, so assigning
 * `cvDataJson` straight to `CvData` fails on unions such as `ContactType` and
 * `SectionId`. Using `as CvData` instead would disable type checking entirely —
 * verified: removing the required `company` field still built cleanly.
 */
type Loosen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? Loosen<U>[]
        : T extends object
          ? { [K in keyof T]: Loosen<T[K]> }
          : T;

/**
 * Build-time structure check: catches missing required fields and wrong value
 * types. Invalid union *values* (a misspelled `type: "emial"`) slip through by
 * design — runtime validation covers those.
 */
const _structureCheck: Loosen<CvData> = cvDataJson;
void _structureCheck;

export const CV_DATA = cvDataJson as CvData;
