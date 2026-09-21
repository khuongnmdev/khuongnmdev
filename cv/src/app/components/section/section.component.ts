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

  /**
   * Whether the title is the section's `<h2>`. A section headed by something
   * else keeps the same visible title as a plain label instead: the About
   * section, whose heading is the page's `<h1>` — the profile name — so the
   * page outline starts at level one rather than at an `<h2>` above it.
   */
  readonly titleIsHeading = input(true);
}
