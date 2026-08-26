import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SectionComponent } from '../section/section.component';

@Component({
  selector: 'app-hobbies',
  imports: [SectionComponent],
  templateUrl: './hobbies.component.html',
  styleUrl: './hobbies.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HobbiesComponent {}
