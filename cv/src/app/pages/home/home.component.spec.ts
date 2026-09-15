import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CvDataService } from '@core/services/cv-data.service';
import type { CvData } from '@core/models/cv-data.model';
import { cloneCvData, cvDataServiceWith } from '@app/testing/cv-data.testing';
import { HomeComponent } from './home.component';

/**
 * Sections deliberately scrambled: `order` disagrees with array position, one
 * entry is disabled, and one enabled id (`projects`) has no component
 * registered. The rendered page must sort, skip the disabled entry, and skip
 * the unregistered id without erroring.
 */
function scrambledData(): CvData {
  const data = cloneCvData();
  data.sections = [
    { id: 'skills', title: 'Skills', order: 2, enabled: true, showInPrint: true },
    { id: 'about', title: 'About', order: 1, enabled: true, showInPrint: true },
    { id: 'education', title: 'Education', order: 5, enabled: false, showInPrint: true },
    { id: 'projects', title: 'Projects', order: 3, enabled: true, showInPrint: false },
    { id: 'experience', title: 'Experience', order: 4, enabled: true, showInPrint: true },
  ];
  return data;
}

describe('HomeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: CvDataService, useValue: cvDataServiceWith(scrambledData()) },
      ],
    }).compileComponents();
  });

  function renderedSectionTags(compiled: HTMLElement): string[] {
    return Array.from(compiled.querySelectorAll('.main-container > .section-host')).map(
      (host) => host.firstElementChild?.tagName.toLowerCase() ?? '',
    );
  }

  it('should render the navigation bar', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-nav-bar')).toBeTruthy();
  });

  it('should render enabled sections sorted by order, skipping disabled and unregistered ids', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    // `about` (1) before `skills` (2) before `experience` (4); `projects` (3)
    // has no component and `education` (5) is disabled — neither may appear.
    expect(renderedSectionTags(compiled)).toEqual(['app-about', 'app-skills', 'app-experience']);
    expect(compiled.querySelector('app-education')).toBeNull();
  });

  it('should attach the scroll-spy directive to every rendered section host', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
    const hosts = (fixture.nativeElement as HTMLElement).querySelectorAll('.section-host');
    expect(hosts.length).toBe(3);
    for (const host of Array.from(hosts)) {
      expect(host.hasAttribute('appActiveSection')).toBe(true);
    }
  });
});
