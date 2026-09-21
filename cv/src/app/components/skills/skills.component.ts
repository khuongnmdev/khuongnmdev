import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SKILL_LEVELS } from '@core/models/cv-data.model';
import { InterpolatePipe } from '@core/pipes/interpolate.pipe';
import { CvDataService } from '@core/services/cv-data.service';
import { SectionComponent } from '../section/section.component';

@Component({
  selector: 'app-skills',
  imports: [SectionComponent, InterpolatePipe],
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsComponent {
  private readonly cvData = inject(CvDataService);

  protected readonly ui = this.cvData.ui;

  /** Section heading from the data, so a JSON edit renames it everywhere. */
  protected readonly title = computed(() => this.cvData.sectionTitle('skills'));

  /** Web-visible skill groups, in data order. */
  protected readonly groups = computed(() =>
    this.cvData.data().skills.filter((group) => group.showInWeb !== false),
  );

  /** One dot per possible level; a dot is filled while its step <= level. */
  protected readonly levelSteps = SKILL_LEVELS;
}
