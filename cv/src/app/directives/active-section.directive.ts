import { isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, Output, EventEmitter, OnInit, OnDestroy, Input, Inject, PLATFORM_ID } from '@angular/core';

@Directive({
  selector: '[appActiveSection]',
  standalone: true // Use if your project is standalone
})
export class ActiveSectionDirective implements OnInit, OnDestroy {
  private observer!: IntersectionObserver;

  // Emits the intersection status (true = in view, false = out of view)
  @Output()
  sectionIntersecting = new EventEmitter<boolean>();

  // Optional: Allows customization of the intersection area (e.g., '-50% 0px -50%')
  @Input()
  rootMargin: string = '0px';

  // Optional: Defines how much of the target must be visible to trigger the event (0.0 to 1.0)
  @Input()
  threshold: number | number[] = 0.5;

  constructor(
    private el: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Check if the browser supports Intersection Observer
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(this.callback, {
          root: null, // Use the viewport
          rootMargin: this.rootMargin,
          threshold: this.threshold
        });

        // Start observing the host element (the section component)
        this.observer.observe(this.el.nativeElement);
      }
    }
  }

  // The callback function executed when the intersection changes
  private callback: IntersectionObserverCallback = (entries, observer) => {
    entries.forEach(entry => {
      // isIntersecting is true when the target element intersects the root (viewport)
      if (entry.isIntersecting) {
        this.sectionIntersecting.emit(true);
      } else {
        // You might want to emit 'false' but for a scroll-spy,
        // usually you only care about the one that is 'true'
        this.sectionIntersecting.emit(false);
      }
    });
  }

  ngOnDestroy(): void {
    // Crucial: stop observing and clean up when the component is destroyed
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
