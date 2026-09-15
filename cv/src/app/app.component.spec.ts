import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { CvDataService } from '@core/services/cv-data.service';
import type { CvData } from '@core/models/cv-data.model';
import { AppComponent } from './app.component';
import { cloneCvData, cvDataServiceWith } from './testing/cv-data.testing';

/**
 * Sections deliberately scrambled: `order` disagrees with array position, one
 * entry is disabled, and one enabled id (`projects`) has no component
 * registered. The rendered page must sort, skip the disabled entry, and skip
 * the unregistered id without erroring.
 */
function scrambledData(): CvData {
  const data = cloneCvData();
  // Custom profile values prove that title and meta derive from the data
  // rather than repeating hardcoded strings.
  data.profile.fullName = 'Test Person';
  data.profile.displayName = 'Testy';
  data.profile.headline = 'Test Engineer';
  data.sections = [
    { id: 'skills', title: 'Skills', order: 2, enabled: true, showInPrint: true },
    { id: 'about', title: 'About', order: 1, enabled: true, showInPrint: true },
    { id: 'education', title: 'Education', order: 5, enabled: false, showInPrint: true },
    { id: 'projects', title: 'Projects', order: 3, enabled: true, showInPrint: false },
    { id: 'experience', title: 'Experience', order: 4, enabled: true, showInPrint: true },
  ];
  return data;
}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: CvDataService, useValue: cvDataServiceWith(scrambledData()) }],
    }).compileComponents();
  });

  function renderedSectionTags(compiled: HTMLElement): string[] {
    return Array.from(compiled.querySelectorAll('.main-container > .section-host')).map(
      (host) => host.firstElementChild?.tagName.toLowerCase() ?? '',
    );
  }

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should derive the document title from the profile', () => {
    TestBed.createComponent(AppComponent);
    expect(TestBed.inject(Title).getTitle()).toBe('Testy — Test Engineer');
  });

  it('should derive description and author meta tags from the profile', () => {
    TestBed.createComponent(AppComponent);
    const meta = TestBed.inject(Meta);
    expect(meta.getTag('name="author"')?.content).toBe('Test Person');
    expect(meta.getTag('name="description"')?.content).toContain('Test Person');
    expect(meta.getTag('name="description"')?.content).toContain('Test Engineer');
    expect(meta.getTag('property="og:title"')?.content).toBe('Testy — Test Engineer');
    // Static by design: policy and deployment values, not CV content.
    expect(meta.getTag('name="robots"')?.content).toBe('index, follow');
    expect(meta.getTag('property="og:type"')?.content).toBe('website');
  });

  it('should render the navigation bar', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-nav-bar')).toBeTruthy();
  });

  it('should render enabled sections sorted by order, skipping disabled and unregistered ids', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    // `about` (1) before `skills` (2) before `experience` (4); `projects` (3)
    // has no component and `education` (5) is disabled — neither may appear.
    expect(renderedSectionTags(compiled)).toEqual(['app-about', 'app-skills', 'app-experience']);
    expect(compiled.querySelector('app-education')).toBeNull();
  });

  it('should attach the scroll-spy directive to every rendered section host', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const hosts = (fixture.nativeElement as HTMLElement).querySelectorAll('.section-host');
    expect(hosts.length).toBe(3);
    for (const host of Array.from(hosts)) {
      expect(host.hasAttribute('appActiveSection')).toBe(true);
    }
  });
});
