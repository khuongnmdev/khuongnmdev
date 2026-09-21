import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { CvDataService } from '@core/services/cv-data.service';
import { AppComponent } from './app.component';
import { cloneCvData, cvDataServiceWith } from './testing/cv-data.testing';

describe('AppComponent', () => {
  let cvData: CvDataService;

  beforeEach(async () => {
    // The jsdom document outlives a single test: start from a blank head.
    document.title = '';
    document.head
      .querySelectorAll('meta[name], meta[property], link[rel="canonical"], link[rel="alternate"]')
      .forEach((element) => element.remove());

    // Custom profile values prove that title and meta derive from the data
    // rather than repeating hardcoded strings.
    const data = cloneCvData();
    data.profile.fullName = 'Test Person';
    data.profile.displayName = 'Testy';
    data.profile.headline = 'Test Engineer';
    cvData = cvDataServiceWith(data);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([{ path: '', children: [] }]),
        { provide: CvDataService, useValue: cvData },
      ],
    }).compileComponents();
  });

  /** Creates the shell and completes the first navigation, as a boot does. */
  async function boot() {
    const fixture = TestBed.createComponent(AppComponent);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    return fixture;
  }

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should hand the page over to the router', async () => {
    const fixture = await boot();
    expect((fixture.nativeElement as HTMLElement).querySelector('router-outlet')).toBeTruthy();
  });

  it('should leave the document alone until the first navigation resolves the language', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    expect(TestBed.inject(Title).getTitle()).toBe('');
    expect(TestBed.inject(Meta).getTag('name="description"')).toBeNull();
  });

  it('should derive the document title from the profile', async () => {
    await boot();
    expect(TestBed.inject(Title).getTitle()).toBe('Testy — Test Engineer');
  });

  it('should derive description and author meta tags from the profile', async () => {
    await boot();
    const meta = TestBed.inject(Meta);
    expect(meta.getTag('name="author"')?.content).toBe('Test Person');
    expect(meta.getTag('name="description"')?.content).toContain('Test Person');
    expect(meta.getTag('name="description"')?.content).toContain('Test Engineer');
    expect(meta.getTag('property="og:title"')?.content).toBe('Testy — Test Engineer');
    // Static by design: policy and deployment values, not CV content.
    expect(meta.getTag('name="robots"')?.content).toBe('index, follow');
    expect(meta.getTag('property="og:type"')?.content).toBe('website');
  });

  it('should follow a language switch without a reload', async () => {
    const fixture = await boot();
    expect(document.documentElement.getAttribute('lang')).toBe('en');

    await cvData.useLanguage('vi');
    await fixture.whenStable();
    const meta = TestBed.inject(Meta);
    expect(document.documentElement.getAttribute('lang')).toBe('vi');
    expect(meta.getTag('property="og:locale"')?.content).toBe('vi_VN');
    expect(meta.getTag('name="description"')?.content).toContain('CV của');
    expect(document.head.querySelectorAll('meta[name="description"]').length).toBe(1);
  });
});
