import { CommonModule, ViewportScroller } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { HeaderComponent } from '@components/header/header.component';
import { LeftSidebarComponent } from "@components/left-sidebar/left-sidebar.component";
import { DEFAULT_MENU_ITEMS } from "@constants/app-constants";
import { Ripple } from "primeng/ripple";
import { FragmentService } from "@services/fragment.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

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
export class LandingComponent implements OnInit, AfterViewInit {
  @ViewChildren('section') sections!: QueryList<ElementRef>;
  protected readonly menuItems = DEFAULT_MENU_ITEMS;
  private destroyRef = inject(DestroyRef);

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly viewportScroller: ViewportScroller,
    private readonly fragmentService: FragmentService
  ) {
    this.viewportScroller.setOffset([0, 66]);
  }


  ngOnInit(): void {
    this.activatedRoute.fragment
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(fragment => {
        if (fragment) {
          this.viewportScroller.scrollToAnchor(fragment);
        }
      });
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            if (id) {
              this.fragmentService.setFragment(id);
            }
          }
        });
      }, {threshold: 0.5});

      this.sections.forEach(section => observer.observe(section.nativeElement));
    } else {
      console.warn('IntersectionObserver is not available in this environment.');
    }
  }
}
