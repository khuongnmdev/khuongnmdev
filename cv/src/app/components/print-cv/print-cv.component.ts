import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { SectionId } from '@core/models/cv-data.model';
import { DateRangePipe, yearsOfExperience } from '@core/pipes/date-range.pipe';
import { InterpolatePipe } from '@core/pipes/interpolate.pipe';
import { CvDataService } from '@core/services/cv-data.service';

/** The available print template variants. `classic` is the default. */
export const PRINT_TEMPLATES = ['classic', 'compact'] as const;
export type PrintTemplate = (typeof PRINT_TEMPLATES)[number];

/** Maps any untrusted value (query params, selectors) onto a valid template. */
export function normalizePrintTemplate(value: string | null | undefined): PrintTemplate {
  return (PRINT_TEMPLATES as readonly string[]).includes(value ?? '')
    ? (value as PrintTemplate)
    : 'classic';
}

/**
 * Section ids this theme can lay out. Ids present in the data but absent here
 * are skipped silently, mirroring how the web page treats sections without a
 * registered component.
 */
const RENDERABLE_SECTIONS: ReadonlySet<SectionId> = new Set([
  'about',
  'experience',
  'education',
  'skills',
]);

/**
 * The A4 export markup — dedicated to printing, never a restyled web layout.
 *
 * Everything an automated parser needs is enforced structurally here:
 * a single column where DOM order is reading order, the name and contact
 * block first, real heading levels (h1 name, h2 section, h3 entry), `ul`
 * lists, and no icon carrying information without text beside it. Layout
 * uses only block flow and floats — never flexbox or `order` — so the text
 * stream, the tag tree, and the visual page all agree.
 *
 * Styling lives in the global `src/styles/print.scss`: `@page` rules are
 * discarded inside component styles, and print CSS outgrows the component
 * style budget.
 */
@Component({
  selector: 'app-print-cv',
  imports: [DateRangePipe, InterpolatePipe],
  templateUrl: './print-cv.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintCvComponent {
  private readonly cvData = inject(CvDataService);

  /** Template variant, applied as a modifier class on the sheet root. */
  readonly template = input<PrintTemplate>('classic');

  protected readonly isCompact = computed(() => this.template() === 'compact');

  protected readonly profile = this.cvData.profile;
  protected readonly ui = this.cvData.ui;

  /** Derived from `careerStartDate`, so the figure never goes stale. */
  protected readonly experienceYears = computed(() =>
    yearsOfExperience(this.profile().careerStartDate),
  );

  /**
   * Contacts destined for the printed page. Unlike the web, print includes
   * the phone number and home address — a CV handed to a recruiter is
   * expected to carry them; only an explicit `showInPrint: false` (the
   * birthday) keeps an entry off the sheet.
   */
  protected readonly contacts = computed(() =>
    this.cvData.data().contacts.filter((contact) => contact.showInPrint !== false),
  );

  /** Print sections this theme knows how to render, in data order. */
  protected readonly sections = computed(() =>
    this.cvData.printSections().filter((section) => RENDERABLE_SECTIONS.has(section.id)),
  );

  /**
   * Print-visible entries, newest first, with nested projects pre-filtered
   * and every tech stack pre-joined to a plain string. Joined text instead
   * of chip markup is deliberate: comma separators must be real characters
   * in the text stream, not pseudo-element content a parser may misplace.
   */
  protected readonly experience = computed(() =>
    this.cvData
      .data()
      .experience.filter((entry) => entry.showInPrint !== false)
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .map((entry) => ({
        ...entry,
        tech: entry.techStack?.join(', ') ?? '',
        projects: (entry.projects ?? [])
          .filter((project) => project.showInPrint !== false)
          .map((project) => ({ ...project, tech: project.techStack.join(', ') })),
      })),
  );

  /** Print-visible education entries, newest first. */
  protected readonly education = computed(() =>
    this.cvData
      .data()
      .education.filter((entry) => entry.showInPrint !== false)
      .sort((a, b) => b.startDate.localeCompare(a.startDate)),
  );

  /** Skill groups flattened to `category: name, name, ...` lines. */
  protected readonly skills = computed(() =>
    this.cvData
      .data()
      .skills.filter((group) => group.showInPrint !== false)
      .map((group) => ({
        category: group.category,
        names: group.items.map((item) => item.name).join(', '),
      })),
  );
}
