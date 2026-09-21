import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DateRangePipe } from '@core/pipes/date-range.pipe';
import { InterpolatePipe } from '@core/pipes/interpolate.pipe';
import { CvDataService } from '@core/services/cv-data.service';
import { SectionComponent } from '../section/section.component';

@Component({
  selector: 'app-experience',
  imports: [SectionComponent, DateRangePipe, InterpolatePipe],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceComponent {
  private readonly cvData = inject(CvDataService);

  protected readonly ui = this.cvData.ui;

  /** Section heading from the data, so a JSON edit renames it everywhere. */
  protected readonly title = computed(() => this.cvData.sectionTitle('experience'));

  /**
   * Web-visible entries, newest first. Sorting on `startDate` — not array
   * position — keeps the timeline reverse-chronological however the JSON is
   * ordered. Nested projects are pre-filtered to the web-visible ones so the
   * template stays free of visibility logic.
   */
  protected readonly entries = computed(() =>
    this.cvData
      .data()
      .experience.filter((entry) => entry.showInWeb !== false)
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .map((entry) => ({
        ...entry,
        projects: entry.projects?.filter((project) => project.showInWeb !== false) ?? [],
      })),
  );
}
