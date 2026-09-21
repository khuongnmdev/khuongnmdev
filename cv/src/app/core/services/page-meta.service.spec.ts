import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import type { CvData, Locale } from '@core/models/cv-data.model';
import { CV_DATA } from '@data/cv-data';
import { CV_DATA_VI } from '@data/cv-data.vi';
import { PageMetaService } from './page-meta.service';

const SITE = 'https://khuongnmdev.github.io/khuongnmdev/';

describe('PageMetaService', () => {
  let service: PageMetaService;
  let meta: Meta;

  const datasets: Record<Locale, CvData> = { en: CV_DATA, vi: CV_DATA_VI };

  function apply(locale: Locale): void {
    service.apply(locale, datasets[locale].profile, datasets[locale].ui);
  }

  function hrefOf(selector: string): string | null | undefined {
    return document.head.querySelector(selector)?.getAttribute('href');
  }

  beforeEach(() => {
    // The jsdom document outlives a single test; start every test from a
    // bare head so counts below measure only what `apply` wrote.
    document.head
      .querySelectorAll('meta[name], meta[property], link[rel="canonical"], link[rel="alternate"]')
      .forEach((element) => element.remove());
    document.documentElement.removeAttribute('lang');
    service = TestBed.inject(PageMetaService);
    meta = TestBed.inject(Meta);
  });

  it('sets the English document language, title, and meta tags', () => {
    apply('en');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(TestBed.inject(Title).getTitle()).toBe(
      `${CV_DATA.profile.displayName} — ${CV_DATA.profile.headline} (Angular, React) | CV`,
    );
    expect(meta.getTag('name="description"')?.content).toBe(
      `Resume of ${CV_DATA.profile.fullName}, ${CV_DATA.profile.headline} in ${CV_DATA.profile.location}: ` +
        'Angular and React web apps, work experience, projects, education, and skills.',
    );
    expect(meta.getTag('property="og:locale"')?.content).toBe('en_US');
    expect(meta.getTag('property="og:url"')?.content).toBe(SITE);
    expect(meta.getTag('name="robots"')?.content).toBe('index, follow');
  });

  it('keeps the title of each language within 60 and its description within 160 characters', () => {
    // Roughly what a search result shows before cutting the text off.
    for (const locale of ['en', 'vi'] as const) {
      apply(locale);
      const title = TestBed.inject(Title).getTitle();
      const description = meta.getTag('name="description"')!.content;
      expect([...title].length).toBeGreaterThan(40);
      expect([...title].length).toBeLessThanOrEqual(60);
      expect([...description].length).toBeGreaterThan(120);
      expect([...description].length).toBeLessThanOrEqual(160);
    }
  });

  it('gives each language its own title and description', () => {
    apply('en');
    const english = [TestBed.inject(Title).getTitle(), meta.getTag('name="description"')?.content];
    apply('vi');
    const vietnamese = [TestBed.inject(Title).getTitle(), meta.getTag('name="description"')?.content];
    expect(vietnamese[0]).not.toBe(english[0]);
    expect(vietnamese[1]).not.toBe(english[1]);
  });

  it('switches every language signal to Vietnamese', () => {
    apply('en');
    apply('vi');
    expect(document.documentElement.getAttribute('lang')).toBe('vi');
    expect(meta.getTag('name="description"')?.content).toContain('CV của');
    expect(meta.getTag('property="og:description"')?.content).toContain('CV của');
    expect(meta.getTag('name="twitter:description"')?.content).toContain('CV của');
    expect(meta.getTag('property="og:locale"')?.content).toBe('vi_VN');
    expect(meta.getTag('property="og:url"')?.content).toBe(`${SITE}vi/`);
  });

  it('points the social preview at the card of the active language, fully described', () => {
    const content = (selector: string) => meta.getTag(selector)?.content;
    apply('en');
    expect(content('property="og:image"')).toBe(`${SITE}social-card-en.png`);
    expect(content('name="twitter:image"')).toBe(`${SITE}social-card-en.png`);
    expect(content('property="og:image:width"')).toBe('1200');
    expect(content('property="og:image:height"')).toBe('630');
    expect(content('property="og:image:type"')).toBe('image/png');
    expect(content('property="og:image:alt"')).toBe(
      `Profile card: photo of ${CV_DATA.profile.fullName}, ${CV_DATA.profile.headline}`,
    );
    expect(content('name="twitter:image:alt"')).toBe(content('property="og:image:alt"'));
    expect(content('property="og:site_name"')).toBe(CV_DATA.profile.displayName);

    apply('vi');
    expect(content('property="og:image"')).toBe(`${SITE}social-card-vi.png`);
    expect(content('name="twitter:image"')).toBe(`${SITE}social-card-vi.png`);
    expect(content('property="og:image:alt"')).toContain(CV_DATA_VI.profile.fullName);
    expect(content('property="og:site_name"')).toBe(CV_DATA_VI.profile.displayName);
  });

  it('names the other language as the only og:locale:alternate, whatever the switches', () => {
    const alternates = () =>
      meta.getTags('property="og:locale:alternate"').map((tag) => tag.content);
    apply('en');
    expect(alternates()).toEqual(['vi_VN']);
    apply('vi');
    apply('en');
    apply('vi');
    expect(alternates()).toEqual(['en_US']);
  });

  it('points the canonical link at the page of the active language', () => {
    apply('en');
    expect(hrefOf('link[rel="canonical"]')).toBe(SITE);
    apply('vi');
    expect(hrefOf('link[rel="canonical"]')).toBe(`${SITE}vi/`);
  });

  it('lists every language and x-default as absolute hreflang alternates', () => {
    apply('vi');
    const alternates = Array.from(
      document.head.querySelectorAll<HTMLLinkElement>('link[rel="alternate"]'),
    ).map((link) => [link.getAttribute('hreflang'), link.getAttribute('href')]);
    expect(alternates).toEqual([
      ['en', SITE],
      ['vi', `${SITE}vi/`],
      ['x-default', SITE],
    ]);
  });

  it('never duplicates a tag or link when switching back and forth', () => {
    for (const locale of ['en', 'vi', 'en', 'vi', 'en'] as const) {
      apply(locale);
    }
    const count = (selector: string) => document.head.querySelectorAll(selector).length;
    expect(count('meta[name="description"]')).toBe(1);
    expect(count('meta[name="keywords"]')).toBe(1);
    expect(count('meta[name="robots"]')).toBe(1);
    expect(count('meta[property="og:locale"]')).toBe(1);
    expect(count('meta[property="og:url"]')).toBe(1);
    expect(count('meta[name="twitter:title"]')).toBe(1);
    expect(count('link[rel="canonical"]')).toBe(1);
    expect(count('link[rel="alternate"]')).toBe(3);
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(hrefOf('link[rel="canonical"]')).toBe(SITE);
  });

  it('leaves a route-level robots policy alone', () => {
    meta.addTag({ name: 'robots', content: 'noindex, nofollow' });
    apply('vi');
    expect(meta.getTags('name="robots"').map((tag) => tag.content)).toEqual(['noindex, nofollow']);
  });
});
