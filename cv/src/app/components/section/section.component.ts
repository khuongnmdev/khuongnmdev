import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section.component.html',
  styleUrl: './section.component.scss',
})
export class SectionComponent {
  readonly title = input<string>('Default Title');
  readonly id = input<string>('');
}
