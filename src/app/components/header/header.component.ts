import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal, Signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { Ripple } from "primeng/ripple";
import { DEFAULT_MENU_ITEMS } from "@constants/app-constants";
import { ActivatedRoute } from "@angular/router";
import { ThemeService } from "@services/theme.service";
import { toSignal } from "@angular/core/rxjs-interop";

@Component({
  selector: 'k-header',
  standalone: true,
  imports: [
    CommonModule,
    MenubarModule,
    Ripple,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  protected readonly items: MenuItem[] = DEFAULT_MENU_ITEMS;
  protected readonly isDarkMode = toSignal(this.themeService.isDarkMode()) as Signal<boolean>;
  protected fragment = signal('');

  constructor(
    private readonly route: ActivatedRoute,
    protected readonly themeService: ThemeService
  ) {
    this.route.fragment.subscribe((frag) => {
      if (frag) {
        this.fragment.set(frag)
      }
    });
  }

  ngOnInit() {

  }

  protected switchTheme(): void {
    this.themeService.switchTheme();
  }

  protected readonly menuItems = DEFAULT_MENU_ITEMS;
}
