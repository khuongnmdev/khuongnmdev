import { DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Opens the browser's print dialog once the page is actually ready to print.
 *
 * "Ready" means two things, each of which silently degrades the PDF when
 * skipped:
 * - fonts are loaded, or text renders in a fallback face. The icons are
 *   glyphs of a self-hosted icon webfont, so the same wait covers them —
 *   printed before that font arrives, every icon is simply blank;
 * - images inside the print root are decoded, or the avatar prints blank.
 */
@Injectable({ providedIn: 'root' })
export class PrintService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  /**
   * Waits for fonts and for the images inside `root` (the whole body when
   * omitted), then calls `print()`. A no-op during server rendering, where
   * neither `window` nor a print dialog exists.
   */
  async print(root?: HTMLElement): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const scope = root ?? this.document.body;
    await Promise.all([this.whenFontsReady(), this.whenImagesDecoded(scope)]);
    this.document.defaultView?.print();
  }

  /** Resolves when the Font Loading API reports ready; immediately without it. */
  private whenFontsReady(): Promise<unknown> {
    return this.document.fonts?.ready ?? Promise.resolve();
  }

  /** Decodes every image in scope; a failed decode must not block printing. */
  private whenImagesDecoded(scope: HTMLElement): Promise<unknown> {
    const images = Array.from(scope.querySelectorAll('img'));
    return Promise.all(
      images.map((image) =>
        typeof image.decode === 'function' ? image.decode().catch(() => undefined) : undefined,
      ),
    );
  }
}
