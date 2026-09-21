import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SectionComponent } from './section.component';

/** Uses the component the way every section does: a static id on the host. */
@Component({
  imports: [SectionComponent],
  template: '<app-section title="Experience" id="experience"><p>Body</p></app-section>',
})
class HostComponent {}

describe('SectionComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionComponent],
    }).compileComponents();
  });

  it('should render the title as a real heading in the DOM', async () => {
    const fixture = TestBed.createComponent(SectionComponent);
    fixture.componentRef.setInput('title', 'Experience');
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    // The heading must be a real, rendered h2 in the DOM, so screen
    // readers and the tagged-PDF export see the section structure.
    expect(compiled.querySelector('h2.section-title')?.textContent).toContain('Experience');
  });

  it('should keep the section id on the host element only', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const matches = compiled.querySelectorAll('#experience');
    expect(matches.length).toBe(1);
    expect(matches[0].tagName).toBe('APP-SECTION');
    expect(compiled.querySelector('section')?.hasAttribute('id')).toBe(false);
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
