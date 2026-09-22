import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { formatYearMonth } from '@core/pipes/date-range.pipe';
import { interpolate } from '@core/pipes/interpolate.pipe';
import { CvDataService } from '@core/services/cv-data.service';

/**
 * The web page's footer: copyright and the date the content was last edited.
 *
 * Both figures come from `meta.updatedAt`, never from the clock, so a page
 * prerendered today and one prerendered next year are identical as long as
 * the data is. The year is the edit's year, which is also the honest
 * copyright year of the content.
 */
@Component({
  selector: 'app-page-footer',
  templateUrl: './page-footer.component.html',
  styleUrl: './page-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageFooterComponent {
  private readonly cvData = inject(CvDataService);

  private readonly updatedAt = computed(() => this.cvData.data().meta.updatedAt);

  /** `"© {year} {name}"` → `"© 2026 Nguyen Manh Khuong"`. */
  protected readonly copyright = computed(() =>
    interpolate(this.cvData.ui().footerCopyright, {
      year: this.updatedAt().slice(0, 4),
      name: this.cvData.profile().fullName,
    }),
  );

  /** `"Last updated {date}"` → `"Last updated 09/2026"`, the site's one date format. */
  protected readonly lastUpdated = computed(() =>
    interpolate(this.cvData.ui().footerUpdated, {
      date: formatYearMonth(this.updatedAt().slice(0, 7)),
    }),
  );
}
