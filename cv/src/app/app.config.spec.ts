import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Location, PlatformLocation } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CvDataService } from '@core/services/cv-data.service';
import { cloneCvData, cvDataServiceWith } from '@app/testing/cv-data.testing';
import { appConfig } from './app.config';

/** Links written the way the app writes them: absolute router commands. */
@Component({
  imports: [RouterLink],
  template: `
    <a class="home" [routerLink]="['/']">home</a>
    <a class="vi" [routerLink]="['/', 'vi']">vi</a>
    <a class="print" [routerLink]="['/', 'vi', 'print']" [queryParams]="{ template: 'compact' }"
      >print</a
    >
    <a class="section" [routerLink]="['/', 'vi']" fragment="skills">section</a>
  `,
})
class LinksComponent {}

describe('appConfig', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        { provide: CvDataService, useValue: cvDataServiceWith(cloneCvData()) },
      ],
    });
  });

  it('should end every internal link with the slash the static host redirects to', async () => {
    const fixture = TestBed.createComponent(LinksComponent);
    await fixture.whenStable();
    const href = (selector: string) =>
      (fixture.nativeElement as HTMLElement).querySelector(selector)?.getAttribute('href');
    expect(href('.home')).toBe('/');
    expect(href('.vi')).toBe('/vi/');
    expect(href('.print')).toBe('/vi/print/?template=compact');
    expect(href('.section')).toBe('/vi/#skills');
  });

  it('should keep the slash in the address bar after a navigation', async () => {
    await TestBed.inject(Router).navigateByUrl('/print');
    // The router still matches the slashless path; only the written URL differs.
    expect(TestBed.inject(Location).path()).toBe('/print');
    expect(TestBed.inject(PlatformLocation).pathname).toBe('/print/');
  });
});
