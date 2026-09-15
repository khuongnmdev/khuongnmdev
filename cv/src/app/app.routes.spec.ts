import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CvDataService } from '@core/services/cv-data.service';
import { cloneCvData, cvDataServiceWith } from '@app/testing/cv-data.testing';
import { routes } from './app.routes';

describe('routes', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: CvDataService, useValue: cvDataServiceWith(cloneCvData()) },
      ],
    }).compileComponents();
  });

  it('should redirect an unknown path to the home page', async () => {
    await RouterTestingHarness.create('/nope');
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('should still resolve the print route ahead of the catch-all', async () => {
    await RouterTestingHarness.create('/print');
    expect(TestBed.inject(Router).url).toBe('/print');
  });
});
