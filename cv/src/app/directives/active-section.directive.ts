import { isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
  input,
  output,
} from '@angular/core';

/**
 * Scroll-spy: reports whether the host element intersects the viewport.
 *
 * Zoneless note: the IntersectionObserver callback fires
 * outside Angular, so nothing re-renders on its own when it runs. The directive
 * therefore never mutates state that a template reads directly — it only emits
 * through `sectionIntersecting`, and consumers must write the emitted value
 * into a signal (see `AppComponent.onSectionActive`).
 */
@Directive({
  selector: '[appActiveSection]',
})
export class ActiveSectionDirective implements OnInit, OnDestroy {
  /** Grows or shrinks the intersection area, for example `"-50% 0px -50% 0px"`. */
  readonly rootMargin = input<string>('0px');

  /** How much of the target must be visible to trigger, 0.0 to 1.0. */
  readonly threshold = input<number | number[]>(0.5);

  /** `true` when the host enters the viewport, `false` when it leaves. */
  readonly sectionIntersecting = output<boolean>();

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  private observer?: IntersectionObserver;

  ngOnInit(): void {
    // Prerender has no viewport: `window` and IntersectionObserver only exist
    // in a real browser.
    if (!isPlatformBrowser(this.platformId) || !('IntersectionObserver' in window)) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          this.sectionIntersecting.emit(entry.isIntersecting);
        }
      },
      {
        root: null, // Use the viewport.
        rootMargin: this.rootMargin(),
        threshold: this.threshold(),
      },
    );

    // Start observing the host element (the section component).
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
