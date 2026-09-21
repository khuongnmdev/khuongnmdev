import { TestBed } from '@angular/core/testing';
import { SectionComponent } from './section.component';

describe('SectionComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionComponent],
    }).compileComponents();
  });

  it('should render the title as a real heading in the DOM', async () => {
    const fixture = TestBed.createComponent(SectionComponent);
    fixture.componentRef.setInput('title', 'Experience');
    fixture.componentRef.setInput('id', 'experience');
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    // The heading must be a real, rendered h2 in the DOM, so screen
    // readers and the tagged-PDF export see the section structure.
    expect(compiled.querySelector('h2.section-title')?.textContent).toContain('Experience');
    expect(compiled.querySelector('section')?.id).toBe('experience');
  });

  it('should keep the visible title as a plain label when the section opts out of the heading', async () => {
    const fixture = TestBed.createComponent(SectionComponent);
    fixture.componentRef.setInput('title', 'About');
    fixture.componentRef.setInput('titleIsHeading', false);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
    expect(compiled.querySelector('p.section-title')?.textContent).toContain('About');
  });
});
