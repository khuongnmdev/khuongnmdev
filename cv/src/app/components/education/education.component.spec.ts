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
    // The bundled dataset keeps the months (2010-09 to 2015-12).
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
      { school: 'Current School', degree: 'Master', startDate: '2024-09', endDate: null },
    ];
    expect(periods(await render(data))).toEqual(['2024 – Present']);
  });

  it('should take the present text from the dataset language', async () => {
    const data = cloneCvData();
    data.ui = structuredClone(CV_DATA_VI.ui);
    data.education = [
      { school: 'Current School', degree: 'Master', startDate: '2024-09', endDate: null },
    ];
    const compiled = await render(data);
    expect(periods(compiled)).toEqual(['2024 – Hiện tại']);
    expect(compiled.textContent).not.toContain('Present');
  });

  it('should still sort newest first by the full date when only years show', async () => {
    const data = cloneCvData();
    // Both in 2015, oldest first in the array: only the months tell them apart.
    data.education = [
      { school: 'Spring Course', degree: 'Certificate', startDate: '2015-02', endDate: '2015-06' },
      { school: 'Autumn Course', degree: 'Certificate', startDate: '2015-09', endDate: '2015-12' },
    ];
    const compiled = await render(data);
    const schools = Array.from(compiled.querySelectorAll('.education-school')).map((school) =>
      school.textContent?.trim(),
    );
    expect(schools).toEqual(['Autumn Course', 'Spring Course']);
    expect(periods(compiled)).toEqual(['2015', '2015']);
  });
});
