import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  DOCUMENT,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';

/** The two web color schemes. The A4 print output always uses the light one. */
export type ThemeName = 'light' | 'dark';

/** localStorage key remembering the visitor's explicit theme choice. */
const THEME_STORAGE_KEY = 'cv-theme';

/**
 * Owns the light/dark color scheme of the web theme.
 *
 * The stylesheet already follows `prefers-color-scheme` when `<html>` carries
 * no `data-theme` attribute, so with no stored choice this service leaves the
 * document untouched and only mirrors the system preference into the `theme`
 * signal. An explicit toggle pins `data-theme` on `<html>` and persists it,
 * overriding the system preference on later visits.
 *
 * The signal starts as `'light'` on the server and on the first client render
 * alike, and the stored preference is applied only after the first render.
 * `afterNextRender` never fires during server rendering, which keeps the
 * prerendered markup and the hydrated DOM identical — the cost is a brief
 * first-paint flash for a visitor whose stored choice contradicts their
 * system scheme.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly state = signal<ThemeName>('light');

  /** Effective theme — drives template state such as the toggle icon. */
  readonly theme = this.state.asReadonly();

  constructor() {
    afterNextRender(() => this.applyPreferredTheme());
  }

  /** Flips the theme, pins it on the document, and persists the choice. */
  toggle(): void {
    const next: ThemeName = this.state() === 'dark' ? 'light' : 'dark';
    this.state.set(next);
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.document.documentElement.setAttribute('data-theme', next);
    this.writeStoredTheme(next);
  }

  private applyPreferredTheme(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const stored = this.readStoredTheme();
    if (stored !== null) {
      this.state.set(stored);
      this.document.documentElement.setAttribute('data-theme', stored);
      return;
    }
    // No stored choice: the stylesheet follows the system scheme on its own;
    // only the signal needs to catch up so the toggle icon is truthful.
    if (this.systemPrefersDark()) {
      this.state.set('dark');
    }
  }

  private systemPrefersDark(): boolean {
    return (
      this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    );
  }

  private readStoredTheme(): ThemeName | null {
    try {
      const value = this.document.defaultView?.localStorage?.getItem(THEME_STORAGE_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch {
      // Storage can be blocked (private mode); fall back to the system scheme.
      return null;
    }
  }

  private writeStoredTheme(theme: ThemeName): void {
    try {
      this.document.defaultView?.localStorage?.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Blocked storage only loses persistence, never the toggle itself.
    }
  }
}
