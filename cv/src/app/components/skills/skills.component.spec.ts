import { TestBed } from '@angular/core/testing';
import { CvDataService } from '@core/services/cv-data.service';
import { cloneCvData, cvDataServiceWith } from '@app/testing/cv-data.testing';
import { SkillsComponent } from './skills.component';

describe('SkillsComponent', () => {
  beforeEach(async () => {
    const data = cloneCvData();
    data.skills = [
      {
        category: 'Frameworks',
        items: [
          { name: 'Angular', level: 4 },
          { name: 'Unrated Tool' }, // No level — must render without dots.
        ],
      },
      {
        category: 'Hidden Group',
        showInWeb: false,
        items: [{ name: 'Secret Skill', level: 5 }],
      },
    ];

    await TestBed.configureTestingModule({
      imports: [SkillsComponent],
      providers: [{ provide: CvDataService, useValue: cvDataServiceWith(data) }],
    }).compileComponents();
  });

  async function render(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(SkillsComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('should group skills by category and hide groups flagged showInWeb: false', async () => {
    const compiled = await render();
    const categories = Array.from(compiled.querySelectorAll('.skill-category')).map((el) =>
      el.textContent?.trim(),
    );
    expect(categories).toEqual(['Frameworks']);
    expect(compiled.textContent).not.toContain('Secret Skill');
  });

  it('should render the 1–5 level as filled and unfilled dots', async () => {
    const compiled = await render();
    const items = compiled.querySelectorAll('.skill-item');

    const rated = items[0];
    expect(rated.textContent).toContain('Angular');
    expect(rated.querySelectorAll('.level-dot').length).toBe(5);
    expect(rated.querySelectorAll('.level-dot.filled').length).toBe(4);
    expect(rated.querySelector('.skill-level')?.getAttribute('aria-label')).toBe('Level 4 of 5');

    // No level in the data → no indicator at all, not five empty dots.
    const unrated = items[1];
    expect(unrated.textContent).toContain('Unrated Tool');
    expect(unrated.querySelector('.skill-level')).toBeNull();
  });
});
