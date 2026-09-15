import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CvDataService } from '@core/services/cv-data.service';
import { stubLocalStorage } from '@app/testing/browser-apis.testing';
import { cloneCvData, cvDataServiceWith } from '@app/testing/cv-data.testing';
import { NavBarComponent } from './nav-bar.component';

describe('NavBarComponent', () => {
  let storage: Map<string, string>;

  beforeEach(async () => {
    // The sidebar and theme services persist through localStorage, which
    // this jsdom does not provide — stub it so persistence is observable.
    storage = stubLocalStorage();
    // Scrambled on purpose: the menu must come out sorted by `order`, without
    // the disabled entry, and with the titles the data carries — the custom
    // "Journey" title proves nothing is hardcoded in the component. `skills`
    // deliberately carries no icon, to prove the fallback renders.
    const data = cloneCvData();
    data.profile.avatar = 'test-avatar.jpg';
    data.sections = [
      { id: 'skills', title: 'Skills', order: 3, enabled: true, showInPrint: true },
      {
        id: 'about',
        title: 'About',
        order: 1,
        enabled: true,
        showInPrint: true,
        icon: 'fa-solid fa-user',
      },
      { id: 'hobbies', title: 'Hobbies', order: 4, enabled: false, showInPrint: false },
      {
        id: 'experience',
        title: 'Journey',
        order: 2,
        enabled: true,
        showInPrint: true,
        icon: 'fa-solid fa-briefcase',
      },
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

  afterEach(() => {
    // The theme service pins state on the real document; scrub it so tests
    // cannot leak into each other.
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute('data-theme');
  });

  function menuLabels(compiled: HTMLElement, listSelector: string): (string | undefined)[] {
    return Array.from(compiled.querySelectorAll(`${listSelector} .nav-item`)).map((item) =>
      item.textContent?.trim(),
    );
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

  it('should render each item icon from the data, with a neutral fallback', async () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    await fixture.whenStable();
    // Class token order is not guaranteed by the binding, so compare sets.
    const icons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.nav-list .nav-icon i'),
    ).map((icon) => Array.from(icon.classList).sort());
    // Sorted menu order: About, Journey (experience), Skills — and the
    // icon-less `skills` entry must fall back instead of breaking.
    expect(icons).toEqual([
      ['fa-solid', 'fa-user'],
      ['fa-briefcase', 'fa-solid'],
      ['fa-circle', 'fa-solid'],
    ]);
  });

  it('should carry the section title as title and aria-label for the collapsed rail', async () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    await fixture.whenStable();
    const first = (fixture.nativeElement as HTMLElement).querySelector('.nav-list .nav-item')!;
    expect(first.getAttribute('title')).toBe('About');
    expect(first.getAttribute('aria-label')).toBe('About');
  });

  it('should render the export action as an icon link to the print route with an accessible name', async () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    await fixture.whenStable();
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      '.btn-export',
    )!;
    expect(link.getAttribute('href')).toBe('/print');
    // Icon-only by design, so the name must come from the label attributes.
    expect(link.getAttribute('aria-label')).toBe('Export CV as PDF');
    expect(link.getAttribute('title')).toBe('Export CV as PDF');
    expect(link.querySelector('i.fa-file-pdf')).toBeTruthy();
  });

  it('should toggle the collapsed rail and persist the choice', async () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const bar = compiled.querySelector('.nav-bar')!;
    const toggle = compiled.querySelector<HTMLButtonElement>('.btn-collapse')!;

    expect(bar.classList).not.toContain('collapsed');
    expect(toggle.querySelector('.fa-chevron-left')).toBeTruthy();

    toggle.click();
    await fixture.whenStable();
    expect(bar.classList).toContain('collapsed');
    // The chevron flips to point at the expand direction.
    expect(toggle.querySelector('.fa-chevron-right')).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(storage.get('cv-sidebar-collapsed')).toBe('true');

    toggle.click();
    await fixture.whenStable();
    expect(bar.classList).not.toContain('collapsed');
    expect(storage.get('cv-sidebar-collapsed')).toBe('false');
  });

  it('should switch the theme from the sidebar toggle', async () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.btn-theme',
    )!;
    expect(button.querySelector('.fa-moon')).toBeTruthy();

    button.click();
    await fixture.whenStable();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    // The icon now offers the way back.
    expect(button.querySelector('.fa-sun')).toBeTruthy();
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

  it('should close the mobile menu when the export action is selected', async () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const mobileMenu = compiled.querySelector('.nav-list-mobile')!;

    compiled.querySelector<HTMLButtonElement>('.btn-menu')!.click();
    await fixture.whenStable();
    expect(mobileMenu.classList).toContain('is-show');

    compiled.querySelector<HTMLAnchorElement>('.btn-export')!.click();
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
