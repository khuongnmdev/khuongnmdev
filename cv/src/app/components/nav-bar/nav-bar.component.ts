import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { DEFAULT_MENU, MenuItem } from '@models/menu-item';

@Component({
  selector: 'app-nav-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
  imports: [NgClass],
})
export class NavBarComponent {
  /** Section id currently in view, driven by the scroll-spy in `AppComponent`. */
  readonly activeSection = input<MenuItem['id']>('');

  private readonly document = inject(DOCUMENT);

  protected readonly menuList = signal<MenuItem[]>(DEFAULT_MENU);

  /**
   * Follows `activeSection`, but is also set locally on click so the highlight
   * moves immediately instead of waiting for the smooth scroll to settle.
   */
  protected readonly activatedItem = linkedSignal(() => this.activeSection());

  protected readonly isShowMenu = signal(false);

  protected toggleMenu(): void {
    this.isShowMenu.update((isShown) => !isShown);
  }

  protected navigateTo(item: MenuItem): void {
    this.activatedItem.set(item.id);
    // Close the mobile menu so the selected section is not hidden behind it.
    this.isShowMenu.set(false);
    this.scrollToElementId(item.id);
  }

  private scrollToElementId(id: string): void {
    const element = this.document.querySelector(`#${id}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
