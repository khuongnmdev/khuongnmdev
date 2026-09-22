import { TestBed } from '@angular/core/testing';
import { CvDataService } from '@core/services/cv-data.service';
import { CV_DATA_VI } from '@data/cv-data.vi';
import { cloneCvData, cvDataServiceWith } from '@app/testing/cv-data.testing';
import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  beforeEach(async () => {
    const data = cloneCvData();
    data.profile.headline = 'Test Headline';
    data.profile.location = 'Test City';
    data.profile.summary = ['First bullet', 'Second bullet'];
    data.contacts = [
      {
        type: 'email',
        label: 'Email',
        value: 'visible@example.com',
        href: 'mailto:visible@example.com',
        icon: 'fa-solid fa-envelope',
        showInWeb: true,
        showInPrint: true,
      },
      {
        type: 'phone',
        label: 'Phone',
        value: '0000000000',
        showInWeb: false,
        showInPrint: true,
      },
      {
        // No visibility flags at all: an omitted showInWeb counts as visible.
        type: 'github',
        label: 'GitHub',
        value: 'github.com/example',
        href: 'https://github.com/example',
      },
    ];

    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [{ provide: CvDataService, useValue: cvDataServiceWith(data) }],
    }).compileComponents();
  });

  async function render(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(AboutComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('should head the section with the name and headline as the only h1, above any other heading', async () => {
    const compiled = await render();
    const headings = Array.from(compiled.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    expect(headings.map((heading) => heading.tagName)).toEqual(['H1']);
    // One phrase with a real space between the parts, for anything that
    // reads the heading's text rather than its rendering.
    const { fullName } = cloneCvData().profile;
    expect(headings[0].textContent?.trim()).toBe(`${fullName} Test Headline`);
    expect(headings[0].querySelector('.about-name')?.textContent).toBe(fullName);
    expect(headings[0].querySelector('.about-headline')?.textContent).toBe('Test Headline');
    // The section title stays visible, as a label rather than an h2.
    expect(compiled.querySelector('.section-title')?.textContent?.trim()).toBe('About');
  });

  it('should render the headline once, inside the h1', async () => {
    const compiled = await render();
    const text = compiled.textContent ?? '';
    expect(text.split('Test Headline').length - 1).toBe(1);
    expect(compiled.querySelectorAll('.about-headline').length).toBe(1);
  });

  it('should render location and derived years of experience', async () => {
    const compiled = await render();
    expect(compiled.textContent).toContain('Test City');
    // The figure is derived from careerStartDate at runtime, so only its
    // shape is pinned — a hardcoded number here would rot within a year.
    expect(compiled.textContent).toMatch(/\d+\+ years of experience/);
  });

  it('should phrase the years of experience with the dataset language template', async () => {
    const service = TestBed.inject(CvDataService);
    const data = structuredClone(service.data());
    data.ui = structuredClone(CV_DATA_VI.ui);
    service.loadFrom(data);
    const compiled = await render();
    expect(compiled.textContent).toMatch(/\d+\+ năm kinh nghiệm/);
    expect(compiled.textContent).not.toContain('years of experience');
  });

  it('should head the Vietnamese dataset with its own name and headline', async () => {
    TestBed.inject(CvDataService).loadFrom(structuredClone(CV_DATA_VI));
    const compiled = await render();
    const { fullName, headline } = CV_DATA_VI.profile;
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe(`${fullName} ${headline}`);
  });

  it('should render every summary bullet as a list item', async () => {
    const compiled = await render();
    const bullets = Array.from(compiled.querySelectorAll('.about-summary li')).map((li) =>
      li.textContent?.trim(),
    );
    expect(bullets).toEqual(['First bullet', 'Second bullet']);
  });

  it('should hide contacts flagged showInWeb: false and show the rest', async () => {
    const compiled = await render();
    const text = compiled.textContent ?? '';

    // Explicitly visible, and visible by omitted flag.
    expect(text).toContain('visible@example.com');
    expect(text).toContain('github.com/example');
    // Explicitly hidden — the phone number must never reach the public web.
    expect(text).not.toContain('0000000000');
    expect(compiled.querySelectorAll('.about-contact').length).toBe(2);
  });

  it('should link a contact with an href and pair its icon with visible text', async () => {
    const compiled = await render();
    const link = compiled.querySelector<HTMLAnchorElement>('.about-contact a');
    expect(link?.getAttribute('href')).toBe('mailto:visible@example.com');
    // Never icon-only: the address itself is the link text.
    expect(link?.textContent).toContain('visible@example.com');
    expect(compiled.querySelector('.about-contact .contact-icon i')?.className).toContain(
      'fa-envelope',
    );
  });
});
