import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CvDataService } from '@core/services/cv-data.service';
import type { CvData } from '@core/models/cv-data.model';
import { cloneCvData, cvDataServiceWith } from '@app/testing/cv-data.testing';
import { MainComponent } from './main.component';

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

describe('MainComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainComponent],
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
    const fixture = TestBed.createComponent(MainComponent);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-nav-bar')).toBeTruthy();
  });

  it('should render enabled sections sorted by order, skipping disabled and unregistered ids', async () => {
    const fixture = TestBed.createComponent(MainComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    // `about` (1) before `skills` (2) before `experience` (4); `projects` (3)
    // has no component and `education` (5) is disabled — neither may appear.
    expect(renderedSectionTags(compiled)).toEqual(['app-about', 'app-skills', 'app-experience']);
    expect(compiled.querySelector('app-education')).toBeNull();
  });

  it('should give every id in the page to exactly one element', async () => {
    const fixture = TestBed.createComponent(MainComponent);
    await fixture.whenStable();
    const ids = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('[id]')).map(
      (element) => element.id,
    );
    expect(ids).toEqual(expect.arrayContaining(['about', 'skills', 'experience']));
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  it('should attach the scroll-spy directive to every rendered section host', async () => {
    const fixture = TestBed.createComponent(MainComponent);
    await fixture.whenStable();
    const hosts = (fixture.nativeElement as HTMLElement).querySelectorAll('.section-host');
    expect(hosts.length).toBe(3);
    for (const host of Array.from(hosts)) {
      expect(host.hasAttribute('appActiveSection')).toBe(true);
    }
  });
});

describe('MainComponent with the bundled dataset', () => {
  const data = cloneCvData();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainComponent],
      providers: [provideRouter([]), { provide: CvDataService, useValue: cvDataServiceWith(data) }],
    }).compileComponents();
  });

  async function render(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(MainComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('should carry each enabled section id on exactly one element', async () => {
    const compiled = await render();
    const enabled = data.sections.filter((section) => section.enabled);
    expect(enabled.length).toBeGreaterThan(0);
    for (const section of enabled) {
      expect(compiled.querySelectorAll(`[id="${section.id}"]`).length).toBe(1);
    }
    const ids = Array.from(compiled.querySelectorAll('[id]')).map((element) => element.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  it('should have exactly one h1, the profile name, ahead of every other heading', async () => {
    const compiled = await render();
    const h1 = compiled.querySelectorAll('h1');
    expect(h1.length).toBe(1);
    expect(h1[0].textContent?.trim()).toBe(data.profile.fullName);
    expect(compiled.querySelector('h1, h2, h3, h4, h5, h6')).toBe(h1[0]);
  });
});
