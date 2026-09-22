import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { Locale } from '@core/models/cv-data.model';
import { CvDataService } from '@core/services/cv-data.service';
import { cloneCvData, cvDataServiceWith } from '@app/testing/cv-data.testing';
import { localizedRoutes } from './app.routes';

describe('routes', () => {
  let cvData: CvDataService;
  let useLanguage: ReturnType<typeof vi.spyOn>;

  /** The router over the routes of the languages in `published`. */
  async function setUp(published: readonly Locale[]) {
    cvData = cvDataServiceWith(cloneCvData());
    useLanguage = vi.spyOn(cvData, 'useLanguage');
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(localizedRoutes(published)),
        { provide: CvDataService, useValue: cvData },
      ],
    }).compileComponents();
  }

  const url = () => TestBed.inject(Router).url;

  describe('with English only', () => {
    beforeEach(() => setUp(['en']));

    it('should redirect an unknown path to the home page', async () => {
      await RouterTestingHarness.create('/nope');
      expect(url()).toBe('/');
    });

    it('should still resolve the print route ahead of the catch-all', async () => {
      await RouterTestingHarness.create('/print');
      expect(url()).toBe('/print');
      expect(cvData.language()).toBe('en');
    });

    it('should serve the unprefixed paths in English', async () => {
      const harness = await RouterTestingHarness.create('/');
      expect(cvData.language()).toBe('en');
      expect(harness.routeNativeElement?.querySelector('app-nav-bar')).toBeTruthy();
    });

    it('should send the Vietnamese home page to the English one, in English', async () => {
      const harness = await RouterTestingHarness.create('/vi');
      expect(url()).toBe('/');
      expect(cvData.language()).toBe('en');
      expect(harness.routeNativeElement?.querySelector('app-nav-bar')).toBeTruthy();
    });

    it('should send the Vietnamese print preview to the English one, query kept', async () => {
      await RouterTestingHarness.create('/vi/print?template=compact');
      expect(url()).toBe('/print?template=compact');
      expect(cvData.language()).toBe('en');
    });

    it('should keep the query and the fragment on the way to the English page', async () => {
      await RouterTestingHarness.create('/vi?utm_source=search#skills');
      expect(url()).toBe('/?utm_source=search#skills');
    });

    it('should send a mistyped Vietnamese path through the English catch-all', async () => {
      await RouterTestingHarness.create('/vi/nope?utm_source=search');
      expect(url()).toBe('/?utm_source=search');
      expect(cvData.language()).toBe('en');
    });

    it('should never load the Vietnamese dataset', async () => {
      const harness = await RouterTestingHarness.create('/vi');
      await harness.navigateByUrl('/vi/print');
      await harness.navigateByUrl('/vi/nope');
      expect(useLanguage).toHaveBeenCalled();
      expect(useLanguage).not.toHaveBeenCalledWith('vi');
      expect(cvData.data().meta.locale).toBe('en');
    });
  });

  describe('with English and Vietnamese', () => {
    beforeEach(() => setUp(['en', 'vi']));

    it('should redirect an unknown path to the home page', async () => {
      await RouterTestingHarness.create('/nope');
      expect(url()).toBe('/');
    });

    it('should serve the unprefixed paths in English', async () => {
      const harness = await RouterTestingHarness.create('/');
      expect(cvData.language()).toBe('en');
      expect(harness.routeNativeElement?.querySelector('app-nav-bar')).toBeTruthy();
    });

    it('should load and activate Vietnamese under the vi prefix', async () => {
      const harness = await RouterTestingHarness.create('/vi');
      expect(url()).toBe('/vi');
      expect(cvData.language()).toBe('vi');
      expect(cvData.data().meta.locale).toBe('vi');
      // The page activates only once the dataset is in place.
      expect(harness.routeNativeElement?.querySelector('app-nav-bar')).toBeTruthy();
    });

    it('should resolve the Vietnamese print route ahead of the catch-all', async () => {
      await RouterTestingHarness.create('/vi/print?template=compact');
      expect(url()).toBe('/vi/print?template=compact');
      expect(cvData.language()).toBe('vi');
    });

    it('should keep a mistyped Vietnamese path in Vietnamese', async () => {
      await RouterTestingHarness.create('/vi/nope');
      expect(url()).toBe('/vi');
      expect(cvData.language()).toBe('vi');
    });

    it('should switch the store back when leaving the Vietnamese pages', async () => {
      const harness = await RouterTestingHarness.create('/vi');
      await harness.navigateByUrl('/');
      expect(cvData.language()).toBe('en');
      expect(cvData.data().meta.locale).toBe('en');
    });
  });
});
