import type { CvData } from '@core/models/cv-data.model';
import cvDataViJson from './cv-data.vi.json';
import type { Loosen } from './loosen';

/** The same build-time structure check the English entry point applies. */
const _structureCheck: Loosen<CvData> = cvDataViJson;
void _structureCheck;

/** The Vietnamese dataset. */
export const CV_DATA_VI = cvDataViJson as CvData;
