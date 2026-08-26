import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should set the document title', () => {
    TestBed.createComponent(AppComponent);
    expect(TestBed.inject(Title).getTitle()).toBe(`Khuong Nguyen's Resume`);
  });

  it('should render the navigation bar and all five sections', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-nav-bar')).toBeTruthy();
    for (const section of ['about', 'experience', 'education', 'skills', 'hobbies']) {
      expect(compiled.querySelector(`app-${section}`)).toBeTruthy();
    }
  });
});
