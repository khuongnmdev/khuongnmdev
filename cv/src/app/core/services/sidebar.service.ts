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
 * two components at once — the nav bar renders the rail and the home page
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

  /** Whether the desktop sidebar shows only the icon rail. */
  readonly collapsed = this.state.asReadonly();

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
    try {
      this.document.defaultView?.localStorage?.setItem(SIDEBAR_STORAGE_KEY, String(next));
    } catch {
      // Blocked storage only loses persistence, never the toggle itself.
    }
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
