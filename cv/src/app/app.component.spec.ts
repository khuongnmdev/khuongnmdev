import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { CvDataService } from '@core/services/cv-data.service';
import { AppComponent } from './app.component';
import { cloneCvData, cvDataServiceWith } from './testing/cv-data.testing';

describe('AppComponent', () => {
  beforeEach(async () => {
    // Custom profile values prove that title and meta derive from the data
    // rather than repeating hardcoded strings.
    const data = cloneCvData();
    data.profile.fullName = 'Test Person';
    data.profile.displayName = 'Testy';
    data.profile.headline = 'Test Engineer';

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), { provide: CvDataService, useValue: cvDataServiceWith(data) }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should hand the page over to the router', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('router-outlet')).toBeTruthy();
  });

  it('should derive the document title from the profile', () => {
    TestBed.createComponent(AppComponent);
    expect(TestBed.inject(Title).getTitle()).toBe('Testy — Test Engineer');
  });

  it('should derive description and author meta tags from the profile', () => {
    TestBed.createComponent(AppComponent);
    const meta = TestBed.inject(Meta);
    expect(meta.getTag('name="author"')?.content).toBe('Test Person');
    expect(meta.getTag('name="description"')?.content).toContain('Test Person');
    expect(meta.getTag('name="description"')?.content).toContain('Test Engineer');
    expect(meta.getTag('property="og:title"')?.content).toBe('Testy — Test Engineer');
    // Static by design: policy and deployment values, not CV content.
    expect(meta.getTag('name="robots"')?.content).toBe('index, follow');
    expect(meta.getTag('property="og:type"')?.content).toBe('website');
  });
});
