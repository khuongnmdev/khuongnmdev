import { TestBed } from '@angular/core/testing';
import type { CvData } from '@core/models/cv-data.model';
import { CvDataService } from '@core/services/cv-data.service';
import { cloneCvData, cvDataServiceWith } from '@app/testing/cv-data.testing';
import { ExperienceComponent } from './experience.component';

/** Two entries deliberately out of order — oldest first — in the array. */
function experienceData(): CvData {
  const data = cloneCvData();
  data.experience = [
    {
      company: 'Old Corp',
      role: 'Developer',
      employmentType: 'full-time',
      startDate: '2018-01',
      endDate: '2020-06',
      current: false,
      techStack: ['AngularJS'],
    },
    {
      company: 'New Corp',
      role: 'Senior Developer',
      employmentType: 'freelance',
      startDate: '2022-03',
      endDate: null,
      current: true,
      summary: 'Entry summary text.',
      techStack: ['Angular', 'RxJS'],
      projects: [
        {
          name: 'Visible Project',
          description: 'A project description.',
          role: 'Front-end developer',
          teamSize: 7,
          techStack: ['Angular', 'Bootstrap'],
        },
        {
          name: 'Hidden Project',
          description: 'Must not appear on the web.',
          role: 'Front-end developer',
          techStack: ['Vue'],
          showInWeb: false,
        },
      ],
    },
  ];
  return data;
}

describe('ExperienceComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperienceComponent],
      providers: [{ provide: CvDataService, useValue: cvDataServiceWith(experienceData()) }],
    }).compileComponents();
  });

  async function render(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(ExperienceComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('should render entries newest first, whatever the array order', async () => {
    const compiled = await render();
    const companies = Array.from(compiled.querySelectorAll('.experience-company')).map((el) =>
      el.textContent?.trim(),
    );
    expect(companies).toEqual(['New Corp', 'Old Corp']);
  });

  it('should render role, employment type, formatted dates, and summary', async () => {
    const compiled = await render();
    const first = compiled.querySelector('.experience-item')!;
    expect(first.querySelector('.experience-role')?.textContent).toContain('Senior Developer');
    expect(first.querySelector('.experience-meta')?.textContent).toContain('freelance');
    expect(first.querySelector('.experience-meta')?.textContent).toContain('03/2022 – Present');
    expect(first.querySelector('.experience-summary')?.textContent).toContain(
      'Entry summary text.',
    );
  });

  it('should render tech stack chips for an entry', async () => {
    const compiled = await render();
    const first = compiled.querySelector('.experience-item')!;
    const chips = Array.from(first.querySelectorAll(':scope > .chip-list .chip')).map((chip) =>
      chip.textContent?.trim(),
    );
    expect(chips).toEqual(['Angular', 'RxJS']);
  });

  it('should render nested projects with name, role, team size, description, and chips', async () => {
    const compiled = await render();
    const project = compiled.querySelector('.project-item')!;
    expect(project.querySelector('.project-name')?.textContent).toContain('Visible Project');
    expect(project.querySelector('.project-meta')?.textContent).toContain('Front-end developer');
    expect(project.querySelector('.project-meta')?.textContent).toContain('Team of 7');
    expect(project.querySelector('.project-description')?.textContent).toContain(
      'A project description.',
    );
    const chips = Array.from(project.querySelectorAll('.chip')).map((chip) =>
      chip.textContent?.trim(),
    );
    expect(chips).toEqual(['Angular', 'Bootstrap']);
  });

  it('should hide projects flagged showInWeb: false', async () => {
    const compiled = await render();
    expect(compiled.textContent).not.toContain('Hidden Project');
    expect(compiled.querySelectorAll('.project-item').length).toBe(1);
  });
});
