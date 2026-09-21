import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CvDataService } from '@core/services/cv-data.service';
import { cloneCvData, cvDataServiceWith } from '@app/testing/cv-data.testing';
import { routes } from './app.routes';

describe('routes', () => {
  let cvData: CvDataService;

  beforeEach(async () => {
    cvData = cvDataServiceWith(cloneCvData());
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes), { provide: CvDataService, useValue: cvData }],
    }).compileComponents();
  });

  it('should redirect an unknown path to the home page', async () => {
    await RouterTestingHarness.create('/nope');
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('should still resolve the print route ahead of the catch-all', async () => {
    await RouterTestingHarness.create('/print');
    expect(TestBed.inject(Router).url).toBe('/print');
    expect(cvData.language()).toBe('en');
  });

  it('should serve the unprefixed paths in English', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(cvData.language()).toBe('en');
    expect(harness.routeNativeElement?.querySelector('app-nav-bar')).toBeTruthy();
  });

  it('should load and activate Vietnamese under the vi prefix', async () => {
    const harness = await RouterTestingHarness.create('/vi');
    expect(TestBed.inject(Router).url).toBe('/vi');
    expect(cvData.language()).toBe('vi');
    expect(cvData.data().meta.locale).toBe('vi');
    // The page activates only once the dataset is in place.
    expect(harness.routeNativeElement?.querySelector('app-nav-bar')).toBeTruthy();
  });

  it('should resolve the Vietnamese print route ahead of the catch-all', async () => {
    await RouterTestingHarness.create('/vi/print?template=compact');
    expect(TestBed.inject(Router).url).toBe('/vi/print?template=compact');
    expect(cvData.language()).toBe('vi');
  });

  it('should keep a mistyped Vietnamese path in Vietnamese', async () => {
    await RouterTestingHarness.create('/vi/nope');
    expect(TestBed.inject(Router).url).toBe('/vi');
    expect(cvData.language()).toBe('vi');
  });

  it('should switch the store back when leaving the Vietnamese pages', async () => {
    const harness = await RouterTestingHarness.create('/vi');
    await harness.navigateByUrl('/');
    expect(cvData.language()).toBe('en');
    expect(cvData.data().meta.locale).toBe('en');
  });
});
