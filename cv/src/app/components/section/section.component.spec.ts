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

    // The heading is visually hidden but must stay rendered, so screen
    // readers and the tagged-PDF export still see it.
    expect(compiled.querySelector('h2.section-title')?.textContent).toContain('Experience');
    expect(compiled.querySelector('section')?.id).toBe('experience');
  });
});
