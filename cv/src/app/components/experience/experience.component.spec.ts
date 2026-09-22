import { TestBed } from '@angular/core/testing';
import { EMPLOYMENT_TYPES, type CvData } from '@core/models/cv-data.model';
import { CvDataService } from '@core/services/cv-data.service';
import { CV_DATA_VI } from '@data/cv-data.vi';
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
    // The label from the interface strings, never the raw enum value.
    expect(first.querySelector('.experience-meta')?.textContent).toContain('Freelance');
    expect(first.querySelector('.experience-meta')?.textContent).not.toContain('freelance');
    expect(first.querySelector('.experience-meta')?.textContent).toContain('03/2022 – Present');
    expect(first.querySelector('.experience-summary')?.textContent).toContain(
      'Entry summary text.',
    );
  });

  it('should keep a space between adjacent inline parts in the raw text', async () => {
    // Parsers that read the HTML rather than render it see textContent, so
    // the company and role must not run together into one word.
    const compiled = await render();
    const first = compiled.querySelector('.experience-item')!;
    expect(first.querySelector('.experience-heading')?.textContent?.trim()).toBe(
      'New Corp Senior Developer',
    );
    expect(first.querySelector('.experience-meta')?.textContent?.trim()).toBe(
      '03/2022 – Present Freelance',
    );
    expect(first.querySelector('.project-meta')?.textContent?.trim()).toBe(
      'Front-end developer Team of 7',
    );
  });

  it('should render the employment type as a chip in the meta row, uppercase by CSS only', async () => {
    const compiled = await render();
    const meta = compiled.querySelector('.experience-item .experience-meta')!;
    const type = meta.querySelector('.experience-type')!;
    // The very chip the tech stacks use, not a look-alike.
    expect(type.classList).toContain('chip');
    // The markup keeps the label as written; only the rendering capitalises it.
    expect(type.textContent).toBe('Freelance');
    expect(getComputedStyle(type).textTransform).toBe('uppercase');
    // Next to the dates, where it was.
    expect(meta.children[0].textContent).toBe('03/2022 – Present');
    expect(meta.children[1]).toBe(type);
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
    expect(project.querySelector('.project-meta .project-role')?.textContent).toContain(
      'Front-end developer',
    );
    expect(project.querySelector('.project-meta')?.textContent).toContain('Team of 7');
    expect(project.querySelector('.project-description')?.textContent).toContain(
      'A project description.',
    );
    const chips = Array.from(project.querySelectorAll('.chip')).map((chip) =>
      chip.textContent?.trim(),
    );
    expect(chips).toEqual(['Angular', 'Bootstrap']);
  });

  it('should name each project in a paragraph, leaving the entries as the only headings', async () => {
    const compiled = await render();
    const names = Array.from(compiled.querySelectorAll('.project-item .project-name'));
    expect(names.map((name) => [name.tagName, name.textContent?.trim()])).toEqual([
      ['P', 'Visible Project'],
    ]);
    // One h3 per entry and nothing deeper; the section title is the h2.
    expect(compiled.querySelectorAll('h4, h5, h6').length).toBe(0);
    expect(compiled.querySelectorAll('h3').length).toBe(2);
  });

  it('should hide projects flagged showInWeb: false', async () => {
    const compiled = await render();
    expect(compiled.textContent).not.toContain('Hidden Project');
    expect(compiled.querySelectorAll('.project-item').length).toBe(1);
  });

  it('should label the tech stack lists for assistive technology', async () => {
    const compiled = await render();
    const labels = Array.from(compiled.querySelectorAll('.chip-list')).map((list) =>
      list.getAttribute('aria-label'),
    );
    expect(labels.length).toBeGreaterThan(0);
    expect(new Set(labels)).toEqual(new Set(['Technologies']));
  });

  it('should render every interface string in the dataset language', async () => {
    const data = experienceData();
    data.ui = structuredClone(CV_DATA_VI.ui);
    TestBed.overrideProvider(CvDataService, { useValue: cvDataServiceWith(data) });
    const compiled = await render();
    const first = compiled.querySelector('.experience-item')!;
    expect(first.querySelector('.experience-meta')?.textContent).toContain('03/2022 – Hiện tại');
    expect(first.querySelector('.experience-meta')?.textContent).toContain('Tự do');
    expect(compiled.querySelector('.project-meta')?.textContent).toContain('Nhóm 7 người');
    expect(compiled.querySelector('.chip-list')?.getAttribute('aria-label')).toBe('Công nghệ');
    expect(compiled.textContent).not.toContain('Team of');
  });

  it('should label every employment type', async () => {
    const data = experienceData();
    const [template] = data.experience;
    data.experience = EMPLOYMENT_TYPES.map((employmentType, i) => ({
      ...template,
      company: `Company ${i}`,
      startDate: `201${i}-01`,
      employmentType,
    }));
    TestBed.overrideProvider(CvDataService, { useValue: cvDataServiceWith(data) });
    const compiled = await render();
    const meta = Array.from(compiled.querySelectorAll('.experience-meta')).map(
      (line) => line.textContent ?? '',
    );
    for (const employmentType of EMPLOYMENT_TYPES) {
      const label = data.ui.employmentTypes[employmentType];
      expect(meta.some((line) => line.includes(label))).toBe(true);
      expect(meta.some((line) => line.includes(employmentType))).toBe(false);
    }
  });

  it('should give every rendered project its own timeline marker', async () => {
    const compiled = await render();
    const projects = Array.from(compiled.querySelectorAll('.project-item'));
    expect(projects.length).toBeGreaterThan(0);
    for (const project of projects) {
      const dot = project.querySelector('.project-dot');
      expect(dot).toBeTruthy();
      // Decorative only: it must carry no text and stay out of the
      // accessibility tree.
      expect(dot?.textContent).toBe('');
      expect(dot?.getAttribute('aria-hidden')).toBe('true');
    }
  });
});
