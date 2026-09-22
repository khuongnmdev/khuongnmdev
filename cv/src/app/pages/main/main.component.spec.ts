import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CvDataService } from '@core/services/cv-data.service';
import { SidebarService } from '@core/services/sidebar.service';
import type { CvData } from '@core/models/cv-data.model';
import { CV_DATA } from '@data/cv-data';
import { CV_DATA_VI } from '@data/cv-data.vi';
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

  it('should animate the sidebar only from a toggle until the content margin settles', async () => {
    const fixture = TestBed.createComponent(MainComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.app-container')!;
    const main = compiled.querySelector('.main-container')!;
    const transitionEnd = (target: Element, propertyName: string) => {
      const event = new Event('transitionend', { bubbles: true });
      Object.defineProperty(event, 'propertyName', { value: propertyName });
      target.dispatchEvent(event);
    };
    expect(container.classList).not.toContain('sidebar-animating');

    TestBed.inject(SidebarService).toggle();
    await fixture.whenStable();
    expect(container.classList).toContain('sidebar-animating');
    expect(compiled.querySelector('.nav-bar')?.classList).toContain('animating');

    // Other transitions bubbling up — the avatar, a hover, the footer's own
    // margin, which moves with the content — do not end it.
    transitionEnd(compiled.querySelector('.avatar-block')!, 'max-width');
    transitionEnd(main, 'opacity');
    transitionEnd(compiled.querySelector('app-page-footer')!, 'margin-left');
    await fixture.whenStable();
    expect(container.classList).toContain('sidebar-animating');

    transitionEnd(main, 'margin-left');
    await fixture.whenStable();
    expect(container.classList).not.toContain('sidebar-animating');
    expect(container.classList).toContain('sidebar-collapsed');
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
});

/**
 * Both bundled languages, rendered whole: the heading structure and the
 * footer search engines read from the prerendered page.
 */
for (const [language, data] of [
  ['English', CV_DATA],
  ['Vietnamese', CV_DATA_VI],
] as const) {
  describe(`MainComponent with the ${language} dataset`, () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [MainComponent],
        providers: [
          provideRouter([]),
          { provide: CvDataService, useValue: cvDataServiceWith(structuredClone(data)) },
        ],
      }).compileComponents();
    });

    async function render(): Promise<HTMLElement> {
      const fixture = TestBed.createComponent(MainComponent);
      await fixture.whenStable();
      return fixture.nativeElement as HTMLElement;
    }

    it('should have exactly one h1, the name and headline, ahead of every other heading', async () => {
      const compiled = await render();
      const h1 = compiled.querySelectorAll('h1');
      expect(h1.length).toBe(1);
      const text = h1[0].textContent?.trim() ?? '';
      expect(text).toBe(`${data.profile.fullName} ${data.profile.headline}`);
      // Search engines flag an h1 shorter than this.
      expect(text.length).toBeGreaterThanOrEqual(20);
      expect(compiled.querySelector('h1, h2, h3, h4, h5, h6')).toBe(h1[0]);
    });

    it('should head sections and entries only, never a project', async () => {
      const compiled = await render();
      expect(compiled.querySelectorAll('.project-name').length).toBeGreaterThan(0);
      expect(compiled.querySelectorAll('h4, h5, h6').length).toBe(0);
      for (const name of Array.from(compiled.querySelectorAll('.project-name'))) {
        expect(name.tagName).toBe('P');
      }
    });

    it('should end with a contentinfo footer outside <main>, built from the data', async () => {
      const compiled = await render();
      const footers = compiled.querySelectorAll('footer');
      expect(footers.length).toBe(1);
      // A footer inside <main> is not the page's contentinfo landmark.
      expect(footers[0].closest('main')).toBeNull();
      expect(footers[0].closest('.app-container > app-page-footer')).not.toBeNull();
      const [year, month] = data.meta.updatedAt.split('-');
      const copyright = data.ui.footerCopyright
        .replace('{year}', year)
        .replace('{name}', data.profile.fullName);
      const updated = data.ui.footerUpdated.replace('{date}', `${month}/${year}`);
      expect(footers[0].textContent?.trim()).toBe(`${copyright} · ${updated}`);
      expect(footers[0].textContent).toContain(data.profile.fullName);
    });
  });
}
