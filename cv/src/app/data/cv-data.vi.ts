import type { CvData } from '@core/models/cv-data.model';
import cvDataViJson from './cv-data.vi.json';

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

const _structureCheck: Loosen<CvData> = cvDataViJson;
void _structureCheck;

export const CV_DATA_VI = cvDataViJson as CvData;
