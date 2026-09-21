import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section.component.html',
  styleUrl: './section.component.scss',
})
export class SectionComponent {
  /** Required: every heading comes from the data, never from a placeholder. */
  readonly title = input.required<string>();
  readonly id = input<string>('');
}
