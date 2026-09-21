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
    const links = () => Array.from(root.querySelectorAll<HTMLAnchorElement>('.lang-option'));
    const link = (code: string) =>
      links().find((a) => a.querySelector('.lang-code')?.textContent?.trim() === code)!;
    return { harness, root, links, link };
  }

  it('should show the codes EN and VI side by side in one labelled group', async () => {
    const { root, links } = await open('/');
    const group = root.querySelector('.lang-toggle')!;
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Language');
    expect(links().map((a) => a.querySelector('.lang-code')?.textContent?.trim())).toEqual([
      'EN',
      'VI',
    ]);
  });

  it('should mark the current language active on an English page', async () => {
    const { link } = await open('/');
    expect(link('EN').classList).toContain('active');
    expect(link('EN').getAttribute('aria-current')).toBe('page');
    expect(link('VI').classList).not.toContain('active');
    expect(link('VI').hasAttribute('aria-current')).toBe(false);
  });

  it('should link each segment to the same page in its language, with hreflang', async () => {
    const { link } = await open('/');
    expect(link('EN').getAttribute('href')).toBe('/');
    expect(link('VI').getAttribute('href')).toBe('/vi');
    expect(link('VI').getAttribute('hreflang')).toBe('vi');
    expect(link('EN').getAttribute('hreflang')).toBe('en');
  });

  it('should mark only the visible code with the target language', async () => {
    const { link } = await open('/');
    expect(link('VI').querySelector('.lang-code')?.getAttribute('lang')).toBe('vi');
    expect(link('EN').querySelector('.lang-code')?.getAttribute('lang')).toBe('en');
    // The link's title and hidden label are English text on an English page,
    // so neither the link nor the label may claim the target language.
    expect(link('VI').hasAttribute('lang')).toBe(false);
    expect(link('EN').hasAttribute('lang')).toBe(false);
    expect(link('VI').querySelector('.visually-hidden')?.hasAttribute('lang')).toBe(false);
  });

  it('should name each link in the language of the page being viewed', async () => {
    const english = await open('/');
    expect(english.link('VI').getAttribute('title')).toBe('View in Vietnamese');
    const label = english.link('VI').querySelector('.visually-hidden')!;
    expect(label.textContent?.trim()).toBe('View in Vietnamese');
  });

  it('should switch state and names on a Vietnamese page', async () => {
    const { root, link } = await open('/vi');
    expect(link('VI').classList).toContain('active');
    expect(link('VI').getAttribute('aria-current')).toBe('page');
    expect(link('EN').classList).not.toContain('active');
    expect(link('EN').getAttribute('href')).toBe('/');
    expect(link('EN').getAttribute('title')).toBe('Xem bằng tiếng Anh');
    expect(link('EN').querySelector('.visually-hidden')?.textContent?.trim()).toBe(
      'Xem bằng tiếng Anh',
    );
    // Vietnamese text inside a link that must not say it is English.
    expect(link('EN').hasAttribute('lang')).toBe(false);
    expect(link('EN').querySelector('.lang-code')?.getAttribute('lang')).toBe('en');
    expect(root.querySelector('.lang-toggle')?.getAttribute('aria-label')).toBe('Ngôn ngữ');
  });

  it('should keep the print page and its query when switching to Vietnamese', async () => {
    const { link } = await open('/print?template=compact');
    expect(link('VI').getAttribute('href')).toBe('/vi/print?template=compact');
    expect(link('EN').getAttribute('href')).toBe('/print?template=compact');
  });

  it('should keep the print page and its query when switching to English', async () => {
    const { link } = await open('/vi/print?template=compact');
    expect(link('EN').getAttribute('href')).toBe('/print?template=compact');
    expect(link('VI').getAttribute('href')).toBe('/vi/print?template=compact');
  });

  it('should follow a query change made without leaving the page', async () => {
    const { harness, link } = await open('/print');
    expect(link('VI').getAttribute('href')).toBe('/vi/print');

    await TestBed.inject(Router).navigateByUrl('/print?template=compact');
    await harness.fixture.whenStable();
    expect(link('VI').getAttribute('href')).toBe('/vi/print?template=compact');
  });

  it('should navigate to the other language when a segment is followed', async () => {
    const { harness, root } = await open('/');
    root.querySelector<HTMLAnchorElement>('.lang-option[hreflang="vi"]')!.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/vi');
    expect(cvData.language()).toBe('vi');
  });
});
