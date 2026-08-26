import { TestBed } from '@angular/core/testing';
import { NavBarComponent } from './nav-bar.component';

describe('NavBarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavBarComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render one link per menu item in both menus', async () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.nav-list .nav-item').length).toBe(5);
    expect(compiled.querySelectorAll('.nav-list-mobile .nav-item').length).toBe(5);
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
});
