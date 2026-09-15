import { TestBed } from '@angular/core/testing';
import { CvDataService } from '@core/services/cv-data.service';
import { cloneCvData, cvDataServiceWith } from '../../testing/cv-data.testing';
import { NavBarComponent } from './nav-bar.component';

describe('NavBarComponent', () => {
  beforeEach(async () => {
    // Scrambled on purpose: the menu must come out sorted by `order`, without
    // the disabled entry, and with the titles the data carries — the custom
    // "Journey" title proves nothing is hardcoded in the component.
    const data = cloneCvData();
    data.sections = [
      { id: 'skills', title: 'Skills', order: 3, enabled: true, showInPrint: true },
      { id: 'about', title: 'About', order: 1, enabled: true, showInPrint: true },
      { id: 'hobbies', title: 'Hobbies', order: 4, enabled: false, showInPrint: false },
      { id: 'experience', title: 'Journey', order: 2, enabled: true, showInPrint: true },
    ];

    await TestBed.configureTestingModule({
      imports: [NavBarComponent],
      providers: [{ provide: CvDataService, useValue: cvDataServiceWith(data) }],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the enabled sections as menu items, sorted by order', async () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const labels = Array.from(compiled.querySelectorAll('.nav-list .nav-item')).map((item) =>
      item.textContent?.trim(),
    );
    expect(labels).toEqual(['About', 'Journey', 'Skills']);
  });

  it('should render the same data-driven menu in the mobile list', async () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const labels = Array.from(compiled.querySelectorAll('.nav-list-mobile .nav-item')).map((item) =>
      item.textContent?.trim(),
    );
    expect(labels).toEqual(['About', 'Journey', 'Skills']);
  });

  it('should close the mobile menu after selecting an item', async () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const mobileMenu = compiled.querySelector('.nav-list-mobile')!;

    compiled.querySelector<HTMLButtonElement>('.btn-menu')!.click();
    await fixture.whenStable();
    expect(mobileMenu.classList).toContain('is-show');

    mobileMenu.querySelector<HTMLAnchorElement>('.nav-item')!.click();
    await fixture.whenStable();
    expect(mobileMenu.classList).not.toContain('is-show');
  });

  it('should highlight the section reported by activeSection', async () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    fixture.componentRef.setInput('activeSection', 'skills');
    await fixture.whenStable();
    const activated = (fixture.nativeElement as HTMLElement).querySelector('.nav-list .nav-item.activated');
    expect(activated?.textContent).toContain('Skills');
  });

  it('should show the avatar from the profile data', async () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    await fixture.whenStable();
    const avatar = (fixture.nativeElement as HTMLElement).querySelector<HTMLImageElement>('.avatar-block img');
    expect(avatar?.getAttribute('src')).toBe('https://avatars.githubusercontent.com/u/120535999');
  });
});
