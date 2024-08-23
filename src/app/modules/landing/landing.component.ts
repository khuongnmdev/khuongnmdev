import { CommonModule, DOCUMENT, ViewportScroller } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { HeaderComponent } from '@components/header/header.component';
import { LeftSidebarComponent } from "@components/left-sidebar/left-sidebar.component";
import { DEFAULT_MENU_ITEMS } from "@constants/app-constants";
import { Ripple } from "primeng/ripple";

@Component({
  selector: 'k-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HeaderComponent,
    LeftSidebarComponent,
    Ripple
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnInit {
  protected readonly menuItems = DEFAULT_MENU_ITEMS;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private readonly activatedRoute: ActivatedRoute,
    private readonly viewportScroller: ViewportScroller
  ) {
    this.viewportScroller.setOffset([0,66]);
  }

  ngOnInit(): void {
    this.activatedRoute.fragment.subscribe(fragment => {
      if (fragment) {
        this.viewportScroller.scrollToAnchor(fragment);
        // this.gotoFragment(fragment);
      }
    });
  }

  private gotoFragment(frag: string) {
    this.document.getElementById(frag)?.scrollIntoView({behavior: 'smooth'});
  }
}
