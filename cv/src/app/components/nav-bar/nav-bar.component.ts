import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageToggleComponent } from '@app/components/language-toggle/language-toggle.component';
import { localizedCommands } from '@core/i18n/localized-url';
import type { SectionConfig } from '@core/models/cv-data.model';
import { CvDataService } from '@core/services/cv-data.service';
import { SidebarService } from '@core/services/sidebar.service';
import { ThemeService } from '@core/services/theme.service';

/** Rendered when a section carries no icon, so the menu never breaks. */
const FALLBACK_MENU_ICON = 'fa-solid fa-circle';

@Component({
  selector: 'app-nav-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
  imports: [NgClass, RouterLink, LanguageToggleComponent],
})
export class NavBarComponent {
  /** Section id currently in view, driven by the scroll-spy in `MainComponent`. */
  readonly activeSection = input<string>('');

  private readonly document = inject(DOCUMENT);
  private readonly cvData = inject(CvDataService);
  private readonly sidebar = inject(SidebarService);
  private readonly themeService = inject(ThemeService);

  protected readonly profile = this.cvData.profile;
  protected readonly ui = this.cvData.ui;

  /**
   * The page the section links point into: this language's CV page. The
   * section id travels as the fragment, so each link resolves to the right
   * language even though `<base href>` sits at the site root. Replacing the
   * history entry keeps Back from stepping through every section visited.
   */
  protected readonly homeLink = computed(() => localizedCommands(this.cvData.language()));

  /** The export opens the print preview in the language being viewed. */
  protected readonly printLink = computed(() =>
    localizedCommands(this.cvData.language(), ['print']),
  );

  /**
   * The menu is the enabled sections in `order` — the data's `sections[]` is
   * the single source of menu contents, so adding or reordering a section is
   * a JSON edit.
   */
  protected readonly menuList = this.cvData.sections;

  /** Desktop-only icon-rail state; shared so the page margin can follow. */
  protected readonly isCollapsed = this.sidebar.collapsed;

  protected readonly theme = this.themeService.theme;

  /**
   * Follows `activeSection`, but is also set locally on click so the highlight
   * moves immediately instead of waiting for the smooth scroll to settle.
   */
  protected readonly activatedItem = linkedSignal(() => this.activeSection());

  protected readonly isShowMenu = signal(false);

  protected iconFor(item: SectionConfig): string {
    return item.icon ?? FALLBACK_MENU_ICON;
  }

  protected toggleCollapse(): void {
    this.sidebar.toggle();
  }

  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  protected toggleMenu(): void {
    this.isShowMenu.update((isShown) => !isShown);
  }

  protected navigateTo(item: SectionConfig): void {
    this.activatedItem.set(item.id);
    // Close the mobile menu so the selected section is not hidden behind it.
    this.isShowMenu.set(false);
    this.scrollToElementId(item.id);
  }

  /** Router links leave the page, so the mobile menu must not stay open. */
  protected closeMenu(): void {
    this.isShowMenu.set(false);
  }

  private scrollToElementId(id: string): void {
    const element = this.document.querySelector(`#${id}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
