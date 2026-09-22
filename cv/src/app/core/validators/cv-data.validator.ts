import {
  CONTACT_TYPES,
  EMPLOYMENT_TYPES,
  SECTION_IDS,
  SKILL_LEVELS,
  UI_STRING_KEYS,
  UI_STRING_MAPS,
  UI_STRING_PLACEHOLDERS,
  type CvData,
  type UiStringKey,
} from '@core/models/cv-data.model';

/**
 * Runtime validation for CV data payloads.
 *
 * The build-time structure check on the bundled JSON catches missing required
 * fields and wrong primitive types, but it deliberately widens literal unions,
 * so an invalid union *value* (`type: "emial"`) still compiles. This validator
 * closes that gap and is the gate for user-supplied data files.
 *
 * The allowed union values are imported from the model, so the compile-time
 * types and these runtime checks share one source and cannot drift apart.
 */
export type CvDataValidationResult = { ok: true; data: CvData } | { ok: false; errors: string[] };

/** `YYYY-MM` with a real month, `01`–`12`. */
const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** `YYYY-MM-DD` with a real month and a day of `01`–`31`. */
const ISO_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const REQUIRED_ARRAYS = [
  'contacts',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'hobbies',
  'sections',
] as const;

/**
 * Validates an untrusted payload against the CV data schema. Collects every
 * problem instead of stopping at the first, with the offending path in each
 * message, for example `contacts[2].type: "emial" is not a ContactType`.
 */
export function validateCvData(json: unknown): CvDataValidationResult {
  if (!isRecord(json)) {
    return { ok: false, errors: ['root: expected an object'] };
  }

  const errors: string[] = [];

  validateMeta(json['meta'], errors);
  validateUi(json['ui'], errors);
  validateProfile(json['profile'], errors);

  for (const key of REQUIRED_ARRAYS) {
    if (!Array.isArray(json[key])) {
      errors.push(`${key}: expected an array`);
    }
  }

  if (Array.isArray(json['contacts'])) {
    validateContacts(json['contacts'], errors);
  }
  if (Array.isArray(json['experience'])) {
    validateExperience(json['experience'], errors);
  }
  if (Array.isArray(json['education'])) {
    validateEducation(json['education'], errors);
  }
  if (Array.isArray(json['skills'])) {
    validateSkills(json['skills'], errors);
  }
  if (Array.isArray(json['projects'])) {
    validatePersonalProjects(json['projects'], errors);
  }
  if (Array.isArray(json['certifications'])) {
    validateCertifications(json['certifications'], errors);
  }
  if (Array.isArray(json['sections'])) {
    validateSections(json['sections'], errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  // The checks above cover exactly what the build-time structure check cannot:
  // union values, date shapes, and the coarse shape of the payload.
  return { ok: true, data: json as unknown as CvData };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Renders a value for an error message, keeping string quotes visible. */
function show(value: unknown): string {
  return value === undefined ? 'undefined' : JSON.stringify(value);
}

function checkUnion(
  value: unknown,
  allowed: readonly (string | number)[],
  /** The union name with its article, for example `"an EmploymentType"`. */
  unionName: string,
  path: string,
  errors: string[],
): void {
  if (!allowed.includes(value as string | number)) {
    errors.push(`${path}: ${show(value)} is not ${unionName}`);
  }
}

function checkYearMonth(value: unknown, path: string, errors: string[]): void {
  if (typeof value !== 'string' || !YEAR_MONTH.test(value)) {
    errors.push(`${path}: ${show(value)} is not a YYYY-MM date`);
  }
}

/** For `endDate`-style fields where `null` marks an ongoing period. */
function checkYearMonthOrNull(value: unknown, path: string, errors: string[]): void {
  if (value === null) {
    return;
  }
  checkYearMonth(value, path, errors);
}

function validateMeta(meta: unknown, errors: string[]): void {
  if (!isRecord(meta)) {
    errors.push('meta: expected an object');
    return;
  }
  const version = meta['version'];
  if (typeof version !== 'string' || version.length === 0) {
    errors.push('meta.version: expected a non-empty string');
  }
  // The page footer prints its year and month, so a malformed date would
  // reach the published page.
  const updatedAt = meta['updatedAt'];
  if (typeof updatedAt !== 'string' || !ISO_DATE.test(updatedAt)) {
    errors.push(`meta.updatedAt: ${show(updatedAt)} is not a YYYY-MM-DD date`);
  }
}

/**
 * Interface strings: every key the model lists must be a non-empty string,
 * every sentence template must keep its placeholders, and every nested label
 * map must label each value of its union.
 */
function validateUi(ui: unknown, errors: string[]): void {
  if (!isRecord(ui)) {
    errors.push('ui: expected an object');
    return;
  }
  for (const key of UI_STRING_KEYS) {
    const value = ui[key];
    if (typeof value !== 'string' || value.length === 0) {
      errors.push(`ui.${key}: expected a non-empty string`);
      continue;
    }
    const required: readonly string[] =
      (UI_STRING_PLACEHOLDERS as Partial<Record<UiStringKey, readonly string[]>>)[key] ?? [];
    for (const name of required) {
      if (!value.includes(`{${name}}`)) {
        errors.push(`ui.${key}: missing the {${name}} placeholder`);
      }
    }
  }
  for (const [mapKey, keys] of Object.entries(UI_STRING_MAPS)) {
    const map = ui[mapKey];
    if (!isRecord(map)) {
      errors.push(`ui.${mapKey}: expected an object`);
      continue;
    }
    for (const key of keys) {
      const label = map[key];
      if (typeof label !== 'string' || label.length === 0) {
        errors.push(`ui.${mapKey}.${key}: expected a non-empty string`);
      }
    }
  }
}

function validateProfile(profile: unknown, errors: string[]): void {
  if (!isRecord(profile)) {
    errors.push('profile: expected an object');
    return;
  }
  checkYearMonth(profile['careerStartDate'], 'profile.careerStartDate', errors);
}

function validateContacts(contacts: unknown[], errors: string[]): void {
  contacts.forEach((contact, i) => {
    if (!isRecord(contact)) {
      errors.push(`contacts[${i}]: expected an object`);
      return;
    }
    checkUnion(contact['type'], CONTACT_TYPES, 'a ContactType', `contacts[${i}].type`, errors);
  });
}

function validateExperience(entries: unknown[], errors: string[]): void {
  entries.forEach((entry, i) => {
    if (!isRecord(entry)) {
      errors.push(`experience[${i}]: expected an object`);
      return;
    }
    if (entry['employmentType'] !== undefined) {
      checkUnion(
        entry['employmentType'],
        EMPLOYMENT_TYPES,
        'an EmploymentType',
        `experience[${i}].employmentType`,
        errors,
      );
    }
    checkYearMonth(entry['startDate'], `experience[${i}].startDate`, errors);
    checkYearMonthOrNull(entry['endDate'], `experience[${i}].endDate`, errors);
  });
}

function validateEducation(entries: unknown[], errors: string[]): void {
  entries.forEach((entry, i) => {
    if (!isRecord(entry)) {
      errors.push(`education[${i}]: expected an object`);
      return;
    }
    checkYearMonth(entry['startDate'], `education[${i}].startDate`, errors);
    checkYearMonthOrNull(entry['endDate'], `education[${i}].endDate`, errors);
  });
}

function validateSkills(groups: unknown[], errors: string[]): void {
  groups.forEach((group, i) => {
    if (!isRecord(group)) {
      errors.push(`skills[${i}]: expected an object`);
      return;
    }
    const items = group['items'];
    if (!Array.isArray(items)) {
      errors.push(`skills[${i}].items: expected an array`);
      return;
    }
    items.forEach((item, j) => {
      if (!isRecord(item)) {
        errors.push(`skills[${i}].items[${j}]: expected an object`);
        return;
      }
      if (item['level'] !== undefined) {
        checkUnion(
          item['level'],
          SKILL_LEVELS,
          'a SkillLevel (1-5)',
          `skills[${i}].items[${j}].level`,
          errors,
        );
      }
    });
  });
}

function validatePersonalProjects(projects: unknown[], errors: string[]): void {
  projects.forEach((project, i) => {
    if (!isRecord(project)) {
      errors.push(`projects[${i}]: expected an object`);
      return;
    }
    if (project['startDate'] !== undefined) {
      checkYearMonth(project['startDate'], `projects[${i}].startDate`, errors);
    }
    if (project['endDate'] !== undefined) {
      checkYearMonthOrNull(project['endDate'], `projects[${i}].endDate`, errors);
    }
  });
}

function validateCertifications(certifications: unknown[], errors: string[]): void {
  certifications.forEach((certification, i) => {
    if (!isRecord(certification)) {
      errors.push(`certifications[${i}]: expected an object`);
      return;
    }
    checkYearMonth(certification['issueDate'], `certifications[${i}].issueDate`, errors);
    if (certification['expiryDate'] !== undefined) {
      checkYearMonthOrNull(certification['expiryDate'], `certifications[${i}].expiryDate`, errors);
    }
  });
}

function validateSections(sections: unknown[], errors: string[]): void {
  sections.forEach((section, i) => {
    if (!isRecord(section)) {
      errors.push(`sections[${i}]: expected an object`);
      return;
    }
    checkUnion(section['id'], SECTION_IDS, 'a SectionId', `sections[${i}].id`, errors);
  });
}
