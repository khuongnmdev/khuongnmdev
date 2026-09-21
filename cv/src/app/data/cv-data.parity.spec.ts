import type { CvData } from '@core/models/cv-data.model';
import { validateCvData } from '@core/validators/cv-data.validator';
import { CV_DATA } from './cv-data';
import { CV_DATA_VI } from './cv-data.vi';

/**
 * Fields a translation may change, as path patterns where `[]` stands for any
 * array index. Everything else — dates, visibility flags, types, ids, order,
 * levels, team sizes, icons, tech stacks, links, email addresses — is
 * language-neutral and must stay byte-identical between the datasets, so the
 * two languages can never drift apart in anything but wording.
 */
const TRANSLATABLE = new Set([
  'profile.fullName',
  'profile.displayName',
  'profile.headline',
  'profile.location',
  'profile.summary[]',
  'contacts[].label',
  'experience[].role',
  'experience[].location',
  'experience[].summary',
  'experience[].highlights[]',
  // Covers descriptive names only in intent: a test cannot tell a descriptive
  // project name from a proper product name, which must stay as is.
  'experience[].projects[].name',
  'experience[].projects[].description',
  'experience[].projects[].role',
  'experience[].projects[].highlights[]',
  'education[].school',
  'education[].degree',
  'education[].field',
  'education[].highlights[]',
  'skills[].category',
  'projects[].name',
  'projects[].description',
  'projects[].role',
  'projects[].highlights[]',
  'projects[].links[].label',
  'certifications[].name',
  'languages[].name',
  'languages[].level',
  'languages[].note',
  'hobbies[].name',
  'hobbies[].description',
  'sections[].title',
  'meta.locale',
]);

/**
 * Translatable only for some entries, decided by the entry the field sits on:
 * a contact value is data (an email, a URL) except for a postal address, and
 * a company name is a proper noun except for a self-employed period, where
 * the "company" is a description such as "Freelance".
 */
const TRANSLATABLE_WHEN: Readonly<Record<string, (entry: Record<string, unknown>) => boolean>> = {
  'contacts[].value': (contact) => contact['type'] === 'address',
  'experience[].company': (entry) => entry['employmentType'] === 'freelance',
};

/** Interface strings are translated wholesale; only their structure must match. */
const TRANSLATABLE_SUBTREES = ['ui'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function kindOf(value: unknown): string {
  return Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
}

/**
 * Walks both datasets in lockstep and lists every difference a translation is
 * not allowed to make: a different shape (keys, array lengths, value types)
 * anywhere, or a different value outside the translatable fields.
 */
function parityErrors(english: unknown, translated: unknown): string[] {
  const errors: string[] = [];

  function walk(a: unknown, b: unknown, path: string, pattern: string, entry: unknown): void {
    if (kindOf(a) !== kindOf(b)) {
      errors.push(`${path}: ${kindOf(a)} in English, ${kindOf(b)} in translation`);
      return;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        errors.push(`${path}: ${a.length} entries in English, ${b.length} in translation`);
        return;
      }
      a.forEach((item, i) => walk(item, b[i], `${path}[${i}]`, `${pattern}[]`, a));
      return;
    }
    if (isRecord(a) && isRecord(b)) {
      const keysA = Object.keys(a).sort();
      const keysB = Object.keys(b).sort();
      if (keysA.join() !== keysB.join()) {
        errors.push(`${path || 'root'}: keys [${keysA}] in English, [${keysB}] in translation`);
        return;
      }
      for (const key of keysA) {
        const childPath = path ? `${path}.${key}` : key;
        const childPattern = pattern ? `${pattern}.${key}` : key;
        walk(a[key], b[key], childPath, childPattern, a);
      }
      return;
    }
    if (a === b) {
      return;
    }
    const translatable =
      TRANSLATABLE.has(pattern) ||
      TRANSLATABLE_SUBTREES.some((root) => pattern.startsWith(`${root}.`)) ||
      (isRecord(entry) && (TRANSLATABLE_WHEN[pattern]?.(entry) ?? false));
    if (!translatable) {
      errors.push(`${path}: ${JSON.stringify(a)} must equal ${JSON.stringify(b)}`);
    }
  }

  walk(english, translated, '', '', undefined);
  return errors;
}

describe('English and Vietnamese datasets', () => {
  it('both pass the runtime validator', () => {
    expect(validateCvData(structuredClone(CV_DATA))).toMatchObject({ ok: true });
    expect(validateCvData(structuredClone(CV_DATA_VI))).toMatchObject({ ok: true });
  });

  it('declare their own language in meta.locale', () => {
    expect(CV_DATA.meta.locale).toBe('en');
    expect(CV_DATA_VI.meta.locale).toBe('vi');
  });

  it('are structurally identical and differ only in translatable fields', () => {
    expect(parityErrors(CV_DATA, CV_DATA_VI)).toEqual([]);
  });

  describe('parity check', () => {
    // The check must be able to fail, or a clean result proves nothing.
    function translation(): CvData {
      return structuredClone(CV_DATA);
    }

    it('accepts changes to translatable fields', () => {
      const data = translation();
      data.profile.headline = 'Lập trình viên Front-end';
      data.experience[0].role = 'Kỹ sư';
      data.experience[0].projects![0].description = 'Mô tả';
      data.skills[0].category = 'Ngôn ngữ';
      data.sections[0].title = 'Giới thiệu';
      data.ui.present = 'Hiện tại';
      data.ui.employmentTypes.freelance = 'Tự do';
      expect(parityErrors(CV_DATA, data)).toEqual([]);
    });

    it('rejects changed dates, flags, levels, and tech stacks', () => {
      const data = translation();
      data.experience[0].startDate = '2024-02';
      data.experience[0].showInPrint = false;
      data.skills[0].items[0].level = 1;
      data.experience[0].techStack![0] = 'Góc';
      // Reported in sorted key order, which the walk follows.
      expect(parityErrors(CV_DATA, data)).toEqual([
        'experience[0].showInPrint: true must equal false',
        'experience[0].startDate: "2024-01" must equal "2024-02"',
        `experience[0].techStack[0]: ${JSON.stringify(CV_DATA.experience[0].techStack![0])} must equal "Góc"`,
        `skills[0].items[0].level: ${CV_DATA.skills[0].items[0].level} must equal 1`,
      ]);
    });

    it('rejects a translated skill name and section id', () => {
      const data = translation();
      data.skills[0].items[0].name = 'Tên khác';
      (data.sections[0] as { id: string }).id = 'gioi-thieu';
      expect(parityErrors(CV_DATA, data)).toHaveLength(2);
    });

    it('allows a translated postal address but not a translated phone number or email', () => {
      const data = translation();
      const address = data.contacts.find((contact) => contact.type === 'address')!;
      const phone = data.contacts.find((contact) => contact.type === 'phone')!;
      const email = data.contacts.find((contact) => contact.type === 'email')!;
      address.value = 'Địa chỉ đã dịch';
      phone.value = '000';
      email.href = 'mailto:other@example.com';
      const errors = parityErrors(CV_DATA, data);
      expect(errors).toHaveLength(2);
      expect(errors.join('\n')).not.toContain('Địa chỉ');
    });

    it('allows only a self-employed period to translate its company name', () => {
      const data = translation();
      const freelance = data.experience.find((entry) => entry.employmentType === 'freelance')!;
      freelance.company = 'Tự do';
      expect(parityErrors(CV_DATA, data)).toEqual([]);

      data.experience[0].company = 'Công ty khác';
      expect(parityErrors(CV_DATA, data)).toEqual([
        `experience[0].company: ${JSON.stringify(CV_DATA.experience[0].company)} must equal "Công ty khác"`,
      ]);
    });

    it('rejects different array lengths and different keys', () => {
      const data = translation();
      data.profile.summary.pop();
      delete (data.experience[0] as { summary?: string }).summary;
      expect(parityErrors(CV_DATA, data)).toEqual([
        expect.stringMatching(/^experience\[0\]: keys \[/),
        `profile.summary: ${CV_DATA.profile.summary.length} entries in English, ${
          CV_DATA.profile.summary.length - 1
        } in translation`,
      ]);
    });
  });
});
