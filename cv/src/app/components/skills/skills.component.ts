import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SectionComponent } from '../section/section.component';

@Component({
  selector: 'app-skills',
  imports: [SectionComponent],
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsComponent {}
