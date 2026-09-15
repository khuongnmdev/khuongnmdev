import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { yearsOfExperience } from '@core/pipes/date-range.pipe';
import { CvDataService } from '@core/services/cv-data.service';
import { SectionComponent } from '../section/section.component';

@Component({
  selector: 'app-about',
  imports: [SectionComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  private readonly cvData = inject(CvDataService);

  protected readonly profile = this.cvData.profile;

  /** Section heading from the data, so a JSON edit renames it everywhere. */
  protected readonly title = computed(
    () => this.cvData.data().sections.find((section) => section.id === 'about')?.title ?? 'About',
  );

  /** Derived from `careerStartDate`, so the figure never goes stale. */
  protected readonly experienceYears = computed(() =>
    yearsOfExperience(this.profile().careerStartDate),
  );

  /**
   * Contacts safe to publish. An omitted `showInWeb` counts as visible; only
   * an explicit `false` (phone, home address, birthday) keeps an entry off
   * the public, indexed web.
   */
  protected readonly contacts = computed(() =>
    this.cvData.data().contacts.filter((contact) => contact.showInWeb !== false),
  );

  /** External links open a new tab; in-page schemes like `mailto:` do not. */
  protected targetFor(href: string): string | null {
    return href.startsWith('http') ? '_blank' : null;
  }
}
