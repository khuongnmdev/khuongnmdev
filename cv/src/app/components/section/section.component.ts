import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Shared wrapper of every web section: the title and the section's content.
 *
 * The section id is a plain `id` attribute on `<app-section>` itself — the
 * element the menu links and scrolls to. It is deliberately not an input
 * repeated on the inner `<section>`: Angular keeps a static attribute on the
 * host even when an input of the same name consumes it, so that would put
 * every id in the page twice.
 */
@Component({
  selector: 'app-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section.component.html',
  styleUrl: './section.component.scss',
})
export class SectionComponent {
  /** Required: every heading comes from the data, never from a placeholder. */
  readonly title = input.required<string>();

  /**
   * Whether the title is the section's `<h2>`. A section headed by something
   * else keeps the same visible title as a plain label instead: the About
   * section, whose heading is the page's `<h1>` — the profile name — so the
   * page outline starts at level one rather than at an `<h2>` above it.
   */
  readonly titleIsHeading = input(true);
}
