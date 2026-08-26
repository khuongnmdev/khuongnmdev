import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SectionComponent } from '../section/section.component';

@Component({
  selector: 'app-education',
  imports: [SectionComponent],
  templateUrl: './education.component.html',
  styleUrl: './education.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EducationComponent {}
