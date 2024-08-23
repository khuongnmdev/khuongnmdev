import { ChangeDetectionStrategy, Component, Signal } from '@angular/core';
import { SidebarModule } from "primeng/sidebar";
import { Ripple } from "primeng/ripple";
import { MenuService } from "@services/menu.service";
import { AsyncPipe } from "@angular/common";
import { toSignal } from "@angular/core/rxjs-interop";
import { MenuItem } from "primeng/api";
import { DEFAULT_MENU_ITEMS } from "@constants/app-constants";
import { RouterLink } from "@angular/router";

@Component({
  selector: 'k-left-sidebar',
  standalone: true,
  imports: [
    SidebarModule,
    Ripple,
    AsyncPipe,
    RouterLink
  ],
  templateUrl: './left-sidebar.component.html',
  styleUrl: './left-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeftSidebarComponent {
  protected readonly leftMenuInvisible = toSignal(this.menuService.leftMenuInvisible) as Signal<boolean>;
  protected readonly menuItems: MenuItem[] = DEFAULT_MENU_ITEMS;

  constructor(
    protected readonly menuService: MenuService,
  ) {
  }

  protected handleInvisibleChange(value: boolean) {
    this.menuService.setLeftMenu(value);
  }
}
