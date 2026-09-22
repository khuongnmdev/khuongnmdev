import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { languageResolver } from '@core/i18n/language.resolver';
import { CvDataService } from '@core/services/cv-data.service';
import { cloneCvData, cvDataServiceWith } from '@app/testing/cv-data.testing';
import { LanguageToggleComponent } from './language-toggle.component';

/** Stands in for any routed page that shows the toggle. */
@Component({ imports: [LanguageToggleComponent], template: '<app-language-toggle />' })
class PageStubComponent {}

/** The app's language layout — prefixed Vietnamese, unprefixed English. */
function pages(): Routes {
  return [
    { path: '', component: PageStubComponent },
    { path: 'print', component: PageStubComponent },
  ];
}
const routes: Routes = [
  { path: 'vi', resolve: { language: languageResolver('vi') }, children: pages() },
  { path: '', resolve: { language: languageResolver('en') }, children: pages() },
];

/** The click events that belong to the browser: new tab, new window, download. */
const browserClicks: [string, MouseEventInit][] = [
  ['Ctrl', { ctrlKey: true }],
  ['Cmd', { metaKey: true }],
  ['Shift', { shiftKey: true }],
  ['Alt', { altKey: true }],
  ['middle-button', { button: 1 }],
];

describe('LanguageToggleComponent', () => {
  let cvData: CvDataService;

  beforeEach(async () => {
    cvData = cvDataServiceWith(cloneCvData());
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes), { provide: CvDataService, useValue: cvData }],
    }).compileComponents();
  });

  async function open(url: string) {
    const harness = await RouterTestingHarness.create(url);
    const root = harness.routeNativeElement!;
    // Read from the routed page each time: a language switch replaces it.
    const link = () =>
      harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a.lang-toggle')!;
    /** The code the thumb sits over. */
    const onThumb = () => link().querySelector('.lang-code.on-thumb')?.textContent?.trim();
    return { harness, root, link, onThumb };
  }

  describe('link', () => {
    it('should be a single link with the codes EN and VI, in that order', async () => {
      const { root, link } = await open('/');
      expect(root.querySelectorAll('app-language-toggle a').length).toBe(1);
      const codes = Array.from(link().querySelectorAll('.lang-code'));
      expect(codes.map((code) => code.textContent?.trim())).toEqual(['EN', 'VI']);
    });

    it('should lead an English page to Vietnamese, with hreflang', async () => {
      const { link } = await open('/');
      expect(link().getAttribute('href')).toBe('/vi');
      expect(link().getAttribute('hreflang')).toBe('vi');
    });

    it('should lead a Vietnamese page to English, with hreflang', async () => {
      const { link } = await open('/vi');
      expect(link().getAttribute('href')).toBe('/');
      expect(link().getAttribute('hreflang')).toBe('en');
    });

    it('should keep the print page and its query when switching to Vietnamese', async () => {
      const { link } = await open('/print?template=compact');
      expect(link().getAttribute('href')).toBe('/vi/print?template=compact');
    });

    it('should keep the print page and its query when switching to English', async () => {
      const { link } = await open('/vi/print?template=compact');
      expect(link().getAttribute('href')).toBe('/print?template=compact');
    });

    it('should follow a query change made without leaving the page', async () => {
      const { harness, link } = await open('/print');
      expect(link().getAttribute('href')).toBe('/vi/print');

      await TestBed.inject(Router).navigateByUrl('/print?template=compact');
      await harness.fixture.whenStable();
      expect(link().getAttribute('href')).toBe('/vi/print?template=compact');
    });
  });

  describe('accessibility', () => {
    it('should name the link in English on an English page', async () => {
      const { link } = await open('/');
      expect(link().getAttribute('title')).toBe('View in Vietnamese');
      expect(link().querySelector('.visually-hidden')?.textContent?.trim()).toBe(
        'View in Vietnamese',
      );
    });

    it('should name the link in Vietnamese on a Vietnamese page', async () => {
      const { link } = await open('/vi');
      expect(link().getAttribute('title')).toBe('Xem bằng tiếng Anh');
      expect(link().querySelector('.visually-hidden')?.textContent?.trim()).toBe(
        'Xem bằng tiếng Anh',
      );
    });

    it('should stay a link, not a switch, since it leads to another page', async () => {
      const { link } = await open('/');
      expect(link().hasAttribute('role')).toBe(false);
      expect(link().hasAttribute('aria-checked')).toBe(false);
      expect(link().hasAttribute('aria-pressed')).toBe(false);
    });

    it('should mark only the visible codes with their language, and hide them', async () => {
      const { link } = await open('/');
      const code = (text: string) =>
        Array.from(link().querySelectorAll('.lang-code')).find(
          (element) => element.textContent?.trim() === text,
        )!;
      expect(code('VI').getAttribute('lang')).toBe('vi');
      expect(code('EN').getAttribute('lang')).toBe('en');
      expect(code('VI').getAttribute('aria-hidden')).toBe('true');
      expect(link().querySelector('.lang-thumb')?.getAttribute('aria-hidden')).toBe('true');
      // The title and hidden label are English text on an English page, so
      // neither the link nor the label may claim the target language.
      expect(link().hasAttribute('lang')).toBe(false);
      expect(link().querySelector('.visually-hidden')?.hasAttribute('lang')).toBe(false);
    });
  });

  describe('thumb', () => {
    it('should sit over EN, at the start, on an English page', async () => {
      const { link, onThumb } = await open('/');
      expect(onThumb()).toBe('EN');
      expect(link().classList).not.toContain('thumb-end');
    });

    it('should sit over VI, at the end, on a Vietnamese page', async () => {
      const { link, onThumb } = await open('/vi/print');
      expect(onThumb()).toBe('VI');
      expect(link().classList).toContain('thumb-end');
    });

    it('should not animate before anyone clicks', async () => {
      const { link } = await open('/');
      expect(link().classList).not.toContain('sliding');
    });
  });

  describe('plain click', () => {
    it('should slide the thumb before navigating, then navigate once', async () => {
      const { harness, link, onThumb } = await open('/');
      const router = TestBed.inject(Router);
      const navigate = vi.spyOn(router, 'navigateByUrl');
      // Hold the slide: the navigation must wait for it to finish.
      let finishSlide!: () => void;
      const finished = new Promise<void>((resolve) => (finishSlide = resolve));
      const thumb = link().querySelector('.lang-thumb') as HTMLElement;
      thumb.getAnimations = () => [{ finished } as unknown as Animation];

      const before = link();
      before.click();
      harness.fixture.detectChanges();
      await harness.fixture.whenStable();

      expect(before.classList).toContain('thumb-end');
      expect(before.classList).toContain('sliding');
      expect(onThumb()).toBe('VI');
      expect(router.url).toBe('/');
      expect(navigate).not.toHaveBeenCalled();

      finishSlide();
      await vi.waitFor(() => expect(router.url).toBe('/vi'));
      await harness.fixture.whenStable();
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(cvData.language()).toBe('vi');
      // The new page renders with the thumb already on its side.
      expect(link()).not.toBe(before);
      expect(link().classList).toContain('thumb-end');
      expect(link().classList).not.toContain('sliding');
    });

    it('should navigate at once when there is no slide to wait for', async () => {
      const { harness, link } = await open('/vi');
      const router = TestBed.inject(Router);
      const navigate = vi.spyOn(router, 'navigateByUrl');
      link().click();
      await vi.waitFor(() => expect(router.url).toBe('/'));
      await harness.fixture.whenStable();
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(cvData.language()).toBe('en');
      expect(link().classList).not.toContain('thumb-end');
    });

    it('should prevent the default so the browser does not load the href as well', async () => {
      const { harness, link } = await open('/');
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      link().dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/vi'));
      await harness.fixture.whenStable();
    });

    it('should ignore a second click while the thumb is sliding', async () => {
      const { harness, link } = await open('/');
      const router = TestBed.inject(Router);
      const navigate = vi.spyOn(router, 'navigateByUrl');
      let finishSlide!: () => void;
      const finished = new Promise<void>((resolve) => (finishSlide = resolve));
      (link().querySelector('.lang-thumb') as HTMLElement).getAnimations = () => [
        { finished } as unknown as Animation,
      ];

      link().click();
      harness.fixture.detectChanges();
      link().click();
      harness.fixture.detectChanges();
      finishSlide();
      await vi.waitFor(() => expect(router.url).toBe('/vi'));
      await harness.fixture.whenStable();
      expect(navigate).toHaveBeenCalledTimes(1);
    });

    it('should move the thumb back when the navigation does not happen', async () => {
      const { harness, link, onThumb } = await open('/');
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigateByUrl').mockResolvedValue(false);
      link().click();
      harness.fixture.detectChanges();
      expect(onThumb()).toBe('VI');
      await vi.waitFor(() => {
        harness.fixture.detectChanges();
        expect(onThumb()).toBe('EN');
      });
      expect(link().classList).not.toContain('thumb-end');
      expect(router.url).toBe('/');
    });
  });

  describe('clicks the browser handles', () => {
    for (const [kind, init] of browserClicks) {
      it(`should leave a ${kind} click to the browser and not move the thumb`, async () => {
        const { harness, root, link, onThumb } = await open('/');
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigateByUrl');
        // Records what the browser would see, then stops jsdom from trying
        // to load the page itself.
        let prevented: boolean | undefined;
        root.addEventListener('click', (event) => {
          prevented = event.defaultPrevented;
          event.preventDefault();
        });

        link().dispatchEvent(
          new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init }),
        );
        harness.fixture.detectChanges();
        await harness.fixture.whenStable();

        expect(prevented).toBe(false);
        expect(onThumb()).toBe('EN');
        expect(link().classList).not.toContain('thumb-end');
        expect(link().classList).not.toContain('sliding');
        expect(navigate).not.toHaveBeenCalled();
        expect(router.url).toBe('/');
      });
    }
  });
});
