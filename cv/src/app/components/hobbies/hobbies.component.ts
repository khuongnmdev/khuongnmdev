import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CvDataService } from '@core/services/cv-data.service';
import { SectionComponent } from '../section/section.component';

@Component({
  selector: 'app-hobbies',
  imports: [SectionComponent],
  templateUrl: './hobbies.component.html',
  styleUrl: './hobbies.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HobbiesComponent {
  private readonly cvData = inject(CvDataService);

  /** Section heading from the data, so a JSON edit renames it everywhere. */
  protected readonly title = computed(
    () =>
      this.cvData.data().sections.find((section) => section.id === 'hobbies')?.title ?? 'Hobbies',
  );

  /**
   * Web-visible hobbies. The dataset ships this empty (the section is
   * disabled), but the component renders purely from the data, so filling
   * the array and enabling the section is a JSON-only change.
   */
  protected readonly hobbies = computed(() =>
    this.cvData.data().hobbies.filter((hobby) => hobby.showInWeb !== false),
  );
}
