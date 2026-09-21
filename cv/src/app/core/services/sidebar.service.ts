import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  DOCUMENT,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';

/** localStorage key remembering whether the desktop sidebar is collapsed. */
const SIDEBAR_STORAGE_KEY = 'cv-sidebar-collapsed';

/**
 * Owns the desktop sidebar's collapsed/expanded state. The state matters to
 * two components at once — the nav bar renders the rail and the main page
 * shifts its content margin — so it lives in a shared service rather than in
 * either component.
 *
 * Defaults to expanded. The stored preference is applied only after the first
 * render: `afterNextRender` never fires during server rendering, so the
 * prerendered markup and the hydrated DOM stay identical.
 */
@Injectable({ providedIn: 'root' })
export class SidebarService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly state = signal(false);
  private readonly animatingState = signal(false);

  /** Whether the desktop sidebar shows only the icon rail. */
  readonly collapsed = this.state.asReadonly();

  /**
   * True from a visitor's toggle until the resize transition has finished.
   * The panel's width transitions apply only while it is set, never on
   * their own: otherwise every change of the desktop values animated —
   * crossing the 768px breakpoint, or a crawler's full-page screenshot,
   * which briefly resizes the viewport and caught the panel half-collapsed
   * with its labels painted over the content. A restored preference now
   * applies without an animation too.
   */
  readonly animating = this.animatingState.asReadonly();

  constructor() {
    afterNextRender(() => this.restore());
  }

  /** Flips the collapsed state and persists it for the next visit. */
  toggle(): void {
    const next = !this.state();
    this.state.set(next);
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    // Set in the same render as the new state: a transition runs when the
    // style after the change declares it.
    this.animatingState.set(true);
    try {
      this.document.defaultView?.localStorage?.setItem(SIDEBAR_STORAGE_KEY, String(next));
    } catch {
      // Blocked storage only loses persistence, never the toggle itself.
    }
  }

  /** Ends the toggle animation; the page calls it once the resize is over. */
  endAnimation(): void {
    this.animatingState.set(false);
  }

  private restore(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      if (this.document.defaultView?.localStorage?.getItem(SIDEBAR_STORAGE_KEY) === 'true') {
        this.state.set(true);
      }
    } catch {
      // Blocked storage: keep the expanded default.
    }
  }
}
