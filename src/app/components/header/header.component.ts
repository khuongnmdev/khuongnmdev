import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, Signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { Ripple } from "primeng/ripple";
import { DEFAULT_MENU_ITEMS } from "@constants/app-constants";
import { ThemeService } from "@services/theme.service";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { FragmentService } from "@services/fragment.service";

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
  private destroyRef = inject(DestroyRef);

  constructor(
    protected readonly themeService: ThemeService,
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

  protected switchTheme(): void {
    this.themeService.switchTheme();
  }
}
