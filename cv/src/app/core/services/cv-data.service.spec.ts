import { TestBed } from '@angular/core/testing';
import type { CvData } from '@core/models/cv-data.model';
import { CV_DATA } from '@data/cv-data';
import { CvDataService } from './cv-data.service';

/** A valid dataset whose sections arrive unsorted, with one disabled entry. */
function withScrambledSections(): CvData {
  const data = structuredClone(CV_DATA);
  data.sections = [
    { id: 'skills', title: 'Skills', order: 4, enabled: true, showInPrint: true },
    { id: 'about', title: 'About', order: 1, enabled: true, showInPrint: true },
    { id: 'projects', title: 'Projects', order: 2, enabled: false, showInPrint: true },
    { id: 'experience', title: 'Experience', order: 3, enabled: true, showInPrint: false },
  ];
  return data;
}

describe('CvDataService', () => {
  let service: CvDataService;

  beforeEach(() => {
    service = TestBed.inject(CvDataService);
  });

  it('seeds the store from the bundled dataset', () => {
    expect(service.data()).toEqual(CV_DATA);
    expect(service.profile().fullName).toBe(CV_DATA.profile.fullName);
  });

  it('exposes only enabled sections, sorted by order', () => {
    expect(service.loadFrom(withScrambledSections())).toEqual({ ok: true });
    expect(service.sections().map((s) => s.id)).toEqual(['about', 'experience', 'skills']);
  });

  it('narrows print sections to enabled ones flagged showInPrint', () => {
    expect(service.loadFrom(withScrambledSections())).toEqual({ ok: true });
    // 'experience' is enabled but not printable; 'projects' is printable but
    // disabled — neither may reach the print output.
    expect(service.printSections().map((s) => s.id)).toEqual(['about', 'skills']);
  });

  it('replaces the whole store when given valid data', () => {
    const next = structuredClone(CV_DATA);
    next.profile.fullName = 'Replaced Name';
    expect(service.loadFrom(next)).toEqual({ ok: true });
    expect(service.profile().fullName).toBe('Replaced Name');
  });

  it('rejects an invalid union value and leaves the store untouched', () => {
    // The exact case the build-time structure check cannot see: the shape is
    // right, only the union value is wrong.
    const broken = structuredClone(CV_DATA) as any;
    broken.contacts[0].type = 'emial';

    const result = service.loadFrom(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(['contacts[0].type: "emial" is not a ContactType']);
    }
    expect(service.data()).toEqual(CV_DATA);
  });

  it('titles a section from the data, falling back to the interface default', () => {
    const data = structuredClone(CV_DATA);
    data.sections = [
      { id: 'skills', title: 'Toolbox', order: 1, enabled: true, showInPrint: true },
    ];
    service.loadFrom(data);
    expect(service.sectionTitle('skills')).toBe('Toolbox');
    expect(service.sectionTitle('hobbies')).toBe(data.ui.sectionTitles.hobbies);
  });
});
