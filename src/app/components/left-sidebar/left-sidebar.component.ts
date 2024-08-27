import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, Signal } from '@angular/core';
import { SidebarModule } from "primeng/sidebar";
import { Ripple } from "primeng/ripple";
import { MenuService } from "@services/menu.service";
import { AsyncPipe, NgClass } from "@angular/common";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { MenuItem } from "primeng/api";
import { DEFAULT_MENU_ITEMS } from "@constants/app-constants";
import { RouterLink } from "@angular/router";
import { ThemeService } from "@services/theme.service";
import { FragmentService } from "@services/fragment.service";
import { Button } from "primeng/button";

@Component({
  selector: 'k-left-sidebar',
  standalone: true,
  imports: [
    SidebarModule,
    Ripple,
    AsyncPipe,
    RouterLink,
    NgClass,
    Button
  ],
  templateUrl: './left-sidebar.component.html',
  styleUrl: './left-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeftSidebarComponent {
  protected readonly leftMenuInvisible = toSignal(this.menuService.leftMenuInvisible) as Signal<boolean>;
  protected readonly menuItems: MenuItem[] = DEFAULT_MENU_ITEMS;
  protected fragment = signal('');
  private destroyRef = inject(DestroyRef);

  constructor(
    private readonly menuService: MenuService,
    private readonly themeService: ThemeService,
    private readonly fragmentService: FragmentService,
  ) {
  }

  ngOnInit() {
    this.fragmentService.fragment$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(fragment => {
        if (fragment) {
          this.fragment.set(fragment);
        }
      });
  }

  protected handleInvisibleChange(value: boolean) {
    this.menuService.setLeftMenu(value);
  }

  protected switchTheme(): void {
    this.themeService.switchTheme();
  }
}
