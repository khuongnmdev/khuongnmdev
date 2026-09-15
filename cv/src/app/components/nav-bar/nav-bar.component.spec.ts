import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CvDataService } from '@core/services/cv-data.service';
import { cloneCvData, cvDataServiceWith } from '@app/testing/cv-data.testing';
import { NavBarComponent } from './nav-bar.component';

describe('NavBarComponent', () => {
  beforeEach(async () => {
    // Scrambled on purpose: the menu must come out sorted by `order`, without
    // the disabled entry, and with the titles the data carries — the custom
    // "Journey" title proves nothing is hardcoded in the component.
    const data = cloneCvData();
    data.profile.avatar = 'test-avatar.jpg';
    data.sections = [
      { id: 'skills', title: 'Skills', order: 3, enabled: true, showInPrint: true },
      { id: 'about', title: 'About', order: 1, enabled: true, showInPrint: true },
      { id: 'hobbies', title: 'Hobbies', order: 4, enabled: false, showInPrint: false },
      { id: 'experience', title: 'Journey', order: 2, enabled: true, showInPrint: true },
    ];

    await TestBed.configureTestingModule({
      imports: [NavBarComponent],
      providers: [
        // The export link needs a matching route so a test click navigates
        // instead of erroring.
        provideRouter([{ path: 'print', children: [] }]),
        { provide: CvDataService, useValue: cvDataServiceWith(data) },
      ],
    }).compileComponents();
  });

  function menuLabels(compiled: HTMLElement, listSelector: string): (string | undefined)[] {
    return Array.from(
      compiled.querySelectorAll(`${listSelector} .nav-item:not(.nav-item-export)`),
    ).map((item) => item.textContent?.trim());
  }

  it('should create', () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the enabled sections as menu items, sorted by order', async () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    await fixture.whenStable();
    expect(menuLabels(fixture.nativeElement as HTMLElement, '.nav-list')).toEqual([
      'About',
      'Journey',
      'Skills',
    ]);
  });

  it('should render the same data-driven menu in the mobile list', async () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    await fixture.whenStable();
    expect(menuLabels(fixture.nativeElement as HTMLElement, '.nav-list-mobile')).toEqual([
      'About',
      'Journey',
      'Skills',
    ]);
  });

  it('should link the export entry to the print route in both lists', async () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll<HTMLAnchorElement>('.nav-item-export');
    expect(links.length).toBe(2);
    for (const link of Array.from(links)) {
      expect(link.getAttribute('href')).toBe('/print');
      // Never icon-only: the icon sits beside a visible label.
      expect(link.textContent).toContain('Export PDF');
    }
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

  it('should close the mobile menu when the export entry is selected', async () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const mobileMenu = compiled.querySelector('.nav-list-mobile')!;

    compiled.querySelector<HTMLButtonElement>('.btn-menu')!.click();
    await fixture.whenStable();
    expect(mobileMenu.classList).toContain('is-show');

    mobileMenu.querySelector<HTMLAnchorElement>('.nav-item-export')!.click();
    await fixture.whenStable();
    expect(mobileMenu.classList).not.toContain('is-show');
  });

  it('should highlight the section reported by activeSection', async () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    fixture.componentRef.setInput('activeSection', 'skills');
    await fixture.whenStable();
    const activated = (fixture.nativeElement as HTMLElement).querySelector(
      '.nav-list .nav-item.activated',
    );
    expect(activated?.textContent).toContain('Skills');
  });

  it('should show the avatar from the profile data', async () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    await fixture.whenStable();
    const avatar = (fixture.nativeElement as HTMLElement).querySelector<HTMLImageElement>(
      '.avatar-block img',
    );
    expect(avatar?.getAttribute('src')).toBe('test-avatar.jpg');
  });
});
