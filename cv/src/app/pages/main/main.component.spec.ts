import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PUBLISHED_LOCALES_TOKEN } from '@core/i18n/published-locales';
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

  // The palettes live in the global stylesheet, which the tests do not load,
  // so the computed colours stay the token references each rule declares.
  // Every accent token resolves to the palette's one orange; text names the
  // role made for it, so the rule says the contrast is required.
  it('should colour accent text with the text accent role, never the bare brand token', async () => {
    const compiled = await render();
    const texts = Array.from(compiled.querySelectorAll('*')).filter((element) =>
      Array.from(element.childNodes).some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      ),
    );
    expect(texts.length).toBeGreaterThan(50);
    const plain = texts.filter((element) =>
      getComputedStyle(element).color.includes('--c-secondary'),
    );
    expect(plain.map((element) => element.className)).toEqual([]);

    for (const selector of [
      '.section-title',
      '.about-headline',
      '.experience-role',
      '.experience-type',
      '.chip-list .chip',
      '.project-role',
      '.education-degree > span',
    ]) {
      const element = compiled.querySelector(selector);
      expect(element, selector).not.toBeNull();
      expect(getComputedStyle(element!).color, selector).toBe('var(--c-accent)');
    }
    // The skill dots carry the level, so they need the contrast too.
    const dot = compiled.querySelector('.level-dot.filled')!;
    expect(getComputedStyle(dot).backgroundColor).toBe('var(--c-accent)');
  });
});

/**
 * Every literal colour written in a stylesheet that falls in the orange
 * range: hue 15–35°, saturation above 50%.
 */
function orangeLiterals(css: string): string[] {
  const colour = /#([0-9a-f]{6}|[0-9a-f]{3})\b|rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)[^)]*\)/gi;
  return Array.from(css.matchAll(colour))
    .filter((match) => {
      let rgb: number[];
      if (match[1]) {
        const hex = match[1].length === 3 ? [...match[1]].map((c) => c + c).join('') : match[1];
        rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
      } else {
        rgb = [match[2], match[3], match[4]].map(Number);
      }
      const [r, g, b] = rgb.map((channel) => channel / 255);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max === min || max !== r) return false;
      const saturation = (max - min) / (1 - Math.abs(max + min - 1));
      const hue = (60 * (g - b)) / (max - min);
      return hue >= 15 && hue <= 35 && saturation > 0.5;
    })
    .map((match) => match[0]);
}

describe('MainComponent stylesheets', () => {
  beforeEach(async () => {
    // Everything the page can render: hobbies enabled, and a second language
    // published so the language switch is on the page too.
    const data = cloneCvData();
    data.sections = data.sections.map((section) =>
      section.id === 'hobbies' ? { ...section, enabled: true } : section,
    );
    data.hobbies = [{ name: 'Photography', icon: 'fa-solid fa-camera' }];
    await TestBed.configureTestingModule({
      imports: [MainComponent],
      providers: [
        provideRouter([]),
        { provide: CvDataService, useValue: cvDataServiceWith(data) },
        { provide: PUBLISHED_LOCALES_TOKEN, useValue: ['en', 'vi'] },
      ],
    }).compileComponents();
  });

  // The global palettes are the only place an orange is written, once per
  // palette. A component writing one of its own would put a second orange
  // beside the palette's, in one theme or the other.
  it('should take every orange from a palette token, never from a literal', async () => {
    const fixture = TestBed.createComponent(MainComponent);
    await fixture.whenStable();
    const css = Array.from(document.head.querySelectorAll('style'))
      .map((style) => style.textContent ?? '')
      .join('\n');

    // The stylesheets of every component on the page were collected.
    for (const rule of ['.nav-item', '.lang-thumb', '.experience-item', '.hobby-chip']) {
      expect(css, rule).toContain(rule);
    }
    expect(css).toContain('var(--c-secondary)');
    expect(orangeLiterals(css)).toEqual([]);
    // The language switch's own thumb tokens are gone: its thumb is the
    // palette's accent fill.
    expect(css).not.toMatch(/--c-(on-)?switch-thumb/);
  });

  it('should recognise an orange literal when one is written', () => {
    expect(orangeLiterals('a { color: #f0690b; border: 1px solid rgb(182, 74, 0); }')).toEqual([
      '#f0690b',
      'rgb(182, 74, 0)',
    ]);
    expect(orangeLiterals('a { color: #a84a08; background: #b64a00; }')).toHaveLength(2);
    // Greys, blue, red, and a pale tint are not orange.
    expect(orangeLiterals('a { color: #687078; fill: #0d6efd; stroke: #dc3545; }')).toEqual([]);
    expect(orangeLiterals('a { color: #fff; background: #f8f9fa; }')).toEqual([]);
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
