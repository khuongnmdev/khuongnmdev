import type { CvData } from '@core/models/cv-data.model';
import cvDataJson from './cv-data.json';
import type { Loosen } from './loosen';

/**
 * Build-time structure check: catches missing required fields and wrong value
 * types. Invalid union *values* (a misspelled `type: "emial"`) slip through by
 * design — runtime validation covers those.
 */
const _structureCheck: Loosen<CvData> = cvDataJson;
void _structureCheck;

/** The English dataset — the default language, bundled eagerly. */
export const CV_DATA = cvDataJson as CvData;
