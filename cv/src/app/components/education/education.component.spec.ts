import { TestBed } from '@angular/core/testing';
import type { CvData } from '@core/models/cv-data.model';
import { CvDataService } from '@core/services/cv-data.service';
import { CV_DATA_VI } from '@data/cv-data.vi';
import { cloneCvData, cvDataServiceWith } from '@app/testing/cv-data.testing';
import { EducationComponent } from './education.component';

describe('EducationComponent', () => {
  async function render(data: CvData): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [EducationComponent],
      providers: [{ provide: CvDataService, useValue: cvDataServiceWith(data) }],
    }).compileComponents();
    const fixture = TestBed.createComponent(EducationComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  /** The date span leads each entry's meta row. */
  function periods(compiled: HTMLElement): (string | undefined)[] {
    return Array.from(compiled.querySelectorAll('.education-meta > span:first-child')).map((span) =>
      span.textContent?.trim(),
    );
  }

  it('should show the study period in years only', async () => {
    // The bundled dataset stores years (2010 to 2015); no month may appear.
    const compiled = await render(cloneCvData());
    expect(periods(compiled)).toEqual(['2010 – 2015']);
    const text = compiled.textContent ?? '';
    expect(text).not.toContain('09/2010');
    expect(text).not.toContain('12/2015');
    expect(text).not.toMatch(/\d{2}\/\d{4}/);
  });

  it('should end an ongoing study period with the present text', async () => {
    const data = cloneCvData();
    data.education = [
      { school: 'Current School', degree: 'Master', startDate: '2024', endDate: null },
    ];
    expect(periods(await render(data))).toEqual(['2024 – Present']);
  });

  it('should take the present text from the dataset language', async () => {
    const data = cloneCvData();
    data.ui = structuredClone(CV_DATA_VI.ui);
    data.education = [
      { school: 'Current School', degree: 'Master', startDate: '2024', endDate: null },
    ];
    const compiled = await render(data);
    expect(periods(compiled)).toEqual(['2024 – Hiện tại']);
    expect(compiled.textContent).not.toContain('Present');
  });

  /** School names in rendered order. */
  function schools(compiled: HTMLElement): (string | undefined)[] {
    return Array.from(compiled.querySelectorAll('.education-school')).map((school) =>
      school.textContent?.trim(),
    );
  }

  it('should sort newest first by the start year', async () => {
    const data = cloneCvData();
    // Oldest first in the array, so array order alone would fail.
    data.education = [
      { school: 'College', degree: 'Associate', startDate: '2006', endDate: '2009' },
      { school: 'University', degree: 'Bachelor', startDate: '2010', endDate: '2015' },
    ];
    const compiled = await render(data);
    expect(schools(compiled)).toEqual(['University', 'College']);
    expect(periods(compiled)).toEqual(['2010 – 2015', '2006 – 2009']);
  });

  it('should keep the data order for studies that start in the same year', async () => {
    const data = cloneCvData();
    // Year precision cannot tell these apart, so the stable sort keeps them as written.
    data.education = [
      { school: 'Spring Course', degree: 'Certificate', startDate: '2015', endDate: '2015' },
      { school: 'Autumn Course', degree: 'Certificate', startDate: '2015', endDate: '2016' },
    ];
    const compiled = await render(data);
    expect(schools(compiled)).toEqual(['Spring Course', 'Autumn Course']);
    expect(periods(compiled)).toEqual(['2015', '2015 – 2016']);
  });
});
