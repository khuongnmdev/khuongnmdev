import { DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** How long to wait for the Font Awesome kit to swap `<i>` tags for SVGs. */
const ICON_SWAP_TIMEOUT_MS = 2000;
/** Interval between checks for un-swapped icon tags. */
const ICON_SWAP_POLL_MS = 100;

/**
 * Opens the browser's print dialog once the page is actually ready to print.
 *
 * "Ready" means three things, each of which silently degrades the PDF when
 * skipped:
 * - fonts are loaded, or text renders in a fallback face;
 * - images inside the print root are decoded, or the avatar prints blank;
 * - the Font Awesome kit has swapped `<i>` tags for inline SVGs, or every
 *   icon disappears. The kit loads from a CDN, so this can genuinely lag —
 *   or never happen offline, in which case we print without icons after a
 *   bounded wait instead of hanging forever.
 */
@Injectable({ providedIn: 'root' })
export class PrintService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  /**
   * Waits for fonts, images, and icons inside `root` (the whole body when
   * omitted), then calls `print()`. A no-op during server rendering, where
   * neither `window` nor a print dialog exists.
   */
  async print(root?: HTMLElement): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const scope = root ?? this.document.body;
    await Promise.all([this.whenFontsReady(), this.whenImagesDecoded(scope)]);
    await this.whenIconsSwapped(scope);
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

  /**
   * The Font Awesome kit replaces `<i class="fa-...">` with `<svg>` at
   * runtime, so a remaining `<i>` means the swap has not run yet. Polls until
   * none are left or the timeout passes — the timeout is the graceful
   * fallback for a blocked or absent kit script.
   */
  private async whenIconsSwapped(scope: HTMLElement): Promise<void> {
    const deadline = Date.now() + ICON_SWAP_TIMEOUT_MS;
    while (scope.querySelector('i[class*="fa-"]') !== null && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, ICON_SWAP_POLL_MS));
    }
  }
}
