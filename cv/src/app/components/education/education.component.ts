import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DateRangePipe } from '@core/pipes/date-range.pipe';
import { CvDataService } from '@core/services/cv-data.service';
import { SectionComponent } from '../section/section.component';

@Component({
  selector: 'app-education',
  imports: [SectionComponent, DateRangePipe],
  templateUrl: './education.component.html',
  styleUrl: './education.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EducationComponent {
  private readonly cvData = inject(CvDataService);

  protected readonly ui = this.cvData.ui;

  /** Section heading from the data, so a JSON edit renames it everywhere. */
  protected readonly title = computed(
    () =>
      this.cvData.data().sections.find((section) => section.id === 'education')?.title ??
      'Education',
  );

  /** Web-visible entries, newest first regardless of array position. */
  protected readonly entries = computed(() =>
    this.cvData
      .data()
      .education.filter((entry) => entry.showInWeb !== false)
      .sort((a, b) => b.startDate.localeCompare(a.startDate)),
  );
}
