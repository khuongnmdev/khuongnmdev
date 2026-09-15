import { TestBed } from '@angular/core/testing';
import { CvDataService } from '@core/services/cv-data.service';
import { cloneCvData, cvDataServiceWith } from '@app/testing/cv-data.testing';
import { HobbiesComponent } from './hobbies.component';

describe('HobbiesComponent', () => {
  beforeEach(async () => {
    const data = cloneCvData();
    // The bundled dataset ships hobbies empty and the section disabled; the
    // component must still render purely from whatever the data carries.
    data.hobbies = [
      { name: 'Photography', icon: 'fa-solid fa-camera', description: 'Street photography' },
      { name: 'Running' },
      { name: 'Secret Hobby', showInWeb: false },
    ];

    await TestBed.configureTestingModule({
      imports: [HobbiesComponent],
      providers: [{ provide: CvDataService, useValue: cvDataServiceWith(data) }],
    }).compileComponents();
  });

  it('should render one chip per web-visible hobby, from data alone', async () => {
    const fixture = TestBed.createComponent(HobbiesComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const chips = Array.from(compiled.querySelectorAll('.hobby-chip'));
    expect(chips.map((chip) => chip.textContent?.trim())).toEqual(['Photography', 'Running']);
    expect(compiled.textContent).not.toContain('Secret Hobby');
    expect(chips[0].querySelector('.hobby-icon i')?.className).toContain('fa-camera');
    expect(chips[0].getAttribute('title')).toBe('Street photography');
  });
});
