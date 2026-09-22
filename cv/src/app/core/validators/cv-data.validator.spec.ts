import { UI_STRING_KEYS, UI_STRING_MAPS, UI_STRING_PLACEHOLDERS } from '@core/models/cv-data.model';
import { CV_DATA } from '@data/cv-data';
import { validateCvData } from './cv-data.validator';

/**
 * A mutable deep copy of the bundled dataset. Typed loosely on purpose so
 * tests can plant exactly the invalid values the compiler would reject.
 */
function clone(): any {
  return structuredClone(CV_DATA);
}

function errorsOf(json: unknown): string[] {
  const result = validateCvData(json);
  expect(result.ok).toBe(false);
  return result.ok ? [] : result.errors;
}

describe('validateCvData', () => {
  it('accepts the bundled dataset', () => {
    const result = validateCvData(clone());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.profile.fullName).toBe(CV_DATA.profile.fullName);
    }
  });

  it('rejects payloads that are not plain objects', () => {
    for (const payload of [null, undefined, 42, '{}', []]) {
      expect(validateCvData(payload)).toEqual({
        ok: false,
        errors: ['root: expected an object'],
      });
    }
  });

  it('rejects an invalid contact type with its path', () => {
    const data = clone();
    data.contacts[2].type = 'emial';
    expect(errorsOf(data)).toEqual(['contacts[2].type: "emial" is not a ContactType']);
  });

  it('rejects an invalid section id with its path', () => {
    const data = clone();
    data.sections[0].id = 'intro';
    expect(errorsOf(data)).toEqual(['sections[0].id: "intro" is not a SectionId']);
  });

  it('rejects an invalid employment type with its path', () => {
    const data = clone();
    data.experience[1].employmentType = 'permanent';
    expect(errorsOf(data)).toEqual([
      'experience[1].employmentType: "permanent" is not an EmploymentType',
    ]);
  });

  it('accepts an omitted employment type', () => {
    const data = clone();
    delete data.experience[0].employmentType;
    expect(validateCvData(data).ok).toBe(true);
  });

  it('rejects skill levels outside 1-5', () => {
    const data = clone();
    data.skills[0].items[0].level = 7;
    expect(errorsOf(data)).toEqual(['skills[0].items[0].level: 7 is not a SkillLevel (1-5)']);

    data.skills[0].items[0].level = 0;
    expect(errorsOf(data)).toEqual(['skills[0].items[0].level: 0 is not a SkillLevel (1-5)']);
  });

  it('accepts an omitted skill level', () => {
    const data = clone();
    delete data.skills[0].items[0].level;
    expect(validateCvData(data).ok).toBe(true);
  });

  it('rejects malformed year-month dates', () => {
    const data = clone();
    data.profile.careerStartDate = '01/2016';
    expect(errorsOf(data)).toEqual(['profile.careerStartDate: "01/2016" is not a YYYY-MM date']);
  });

  it('rejects an out-of-range month', () => {
    const data = clone();
    data.experience[0].startDate = '2016-13';
    expect(errorsOf(data)).toEqual(['experience[0].startDate: "2016-13" is not a YYYY-MM date']);
  });

  it('accepts null endDate but rejects a missing one', () => {
    const ongoing = clone();
    ongoing.experience[2].endDate = null;
    expect(validateCvData(ongoing).ok).toBe(true);

    const missing = clone();
    delete missing.experience[0].endDate;
    expect(errorsOf(missing)).toEqual(['experience[0].endDate: undefined is not a YYYY-MM date']);
  });

  it('rejects a missing meta version', () => {
    const data = clone();
    delete data.meta.version;
    expect(errorsOf(data)).toEqual(['meta.version: expected a non-empty string']);
  });

  it('rejects a missing or malformed meta updatedAt', () => {
    const missing = clone();
    delete missing.meta.updatedAt;
    expect(errorsOf(missing)).toEqual(['meta.updatedAt: undefined is not a YYYY-MM-DD date']);

    for (const date of ['2026-09', '15/09/2026', '2026-13-01', '2026-09-32']) {
      const malformed = clone();
      malformed.meta.updatedAt = date;
      expect(errorsOf(malformed)).toEqual([`meta.updatedAt: "${date}" is not a YYYY-MM-DD date`]);
    }
  });

  it('rejects a missing meta block', () => {
    const data = clone();
    delete data.meta;
    expect(errorsOf(data)).toEqual(['meta: expected an object']);
  });

  it('rejects a missing top-level array', () => {
    const data = clone();
    delete data.sections;
    expect(errorsOf(data)).toEqual(['sections: expected an array']);
  });

  describe('ui strings', () => {
    it('rejects a missing ui block', () => {
      const data = clone();
      delete data.ui;
      expect(errorsOf(data)).toEqual(['ui: expected an object']);
    });

    it('requires every key the model lists, as a non-empty string', () => {
      // Driven by the model's key list: a key added there is enforced here
      // without touching the validator.
      for (const key of UI_STRING_KEYS) {
        const missing = clone();
        delete missing.ui[key];
        expect(errorsOf(missing)).toEqual([`ui.${key}: expected a non-empty string`]);
      }
      const empty = clone();
      empty.ui.gpa = '';
      expect(errorsOf(empty)).toEqual(['ui.gpa: expected a non-empty string']);
    });

    it('rejects a sentence template that lost a placeholder', () => {
      const data = clone();
      data.ui.printLead = '{headline} with many years of experience.';
      data.ui.teamSize = 'Team of {cout}';
      expect(errorsOf(data)).toEqual([
        'ui.printLead: missing the {years} placeholder',
        'ui.teamSize: missing the {count} placeholder',
      ]);
    });

    it('rejects footer templates that lost their placeholders', () => {
      const data = clone();
      data.ui.footerCopyright = '© Nguyen Manh Khuong';
      data.ui.footerUpdated = 'Last updated recently';
      expect(errorsOf(data)).toEqual([
        'ui.footerCopyright: missing the {year} placeholder',
        'ui.footerCopyright: missing the {name} placeholder',
        'ui.footerUpdated: missing the {date} placeholder',
      ]);
    });

    it('checks every placeholder the model declares', () => {
      for (const [key, names] of Object.entries(UI_STRING_PLACEHOLDERS)) {
        for (const name of names) {
          const data = clone();
          data.ui[key] = data.ui[key].replace(`{${name}}`, name);
          expect(errorsOf(data)).toEqual([`ui.${key}: missing the {${name}} placeholder`]);
        }
      }
    });

    it('requires a label for every employment type', () => {
      const data = clone();
      delete data.ui.employmentTypes.internship;
      data.ui.employmentTypes['full-time'] = '';
      expect(errorsOf(data)).toEqual([
        'ui.employmentTypes.full-time: expected a non-empty string',
        'ui.employmentTypes.internship: expected a non-empty string',
      ]);
    });

    it('checks every nested label map against its union', () => {
      for (const [mapKey, keys] of Object.entries(UI_STRING_MAPS)) {
        const missingMap = clone();
        delete missingMap.ui[mapKey];
        expect(errorsOf(missingMap)).toEqual([`ui.${mapKey}: expected an object`]);

        for (const key of keys) {
          const missingLabel = clone();
          delete missingLabel.ui[mapKey][key];
          expect(errorsOf(missingLabel)).toEqual([
            `ui.${mapKey}.${key}: expected a non-empty string`,
          ]);
        }
      }
    });
  });

  it('collects every error instead of stopping at the first', () => {
    const data = clone();
    data.contacts[0].type = 'emial';
    data.sections[1].id = 'nope';
    data.skills[0].items[0].level = 9;
    expect(errorsOf(data)).toEqual([
      'contacts[0].type: "emial" is not a ContactType',
      'skills[0].items[0].level: 9 is not a SkillLevel (1-5)',
      'sections[1].id: "nope" is not a SectionId',
    ]);
  });
});
