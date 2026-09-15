// Imported explicitly rather than taken from the test globals: this file is
// not a spec, so the application tsconfig type-checks it too, where the
// globals do not exist.
import { vi } from 'vitest';

/**
 * Test stubs for browser APIs that this jsdom environment does not provide:
 * `window.localStorage` (jsdom only exposes it for non-opaque origins) and
 * `window.matchMedia` (not implemented in jsdom at all).
 *
 * The stubs are installed with `vi.stubGlobal`, which targets the jsdom
 * window itself — exactly the object services reach through
 * `document.defaultView` — and are removed by `vi.unstubAllGlobals()`.
 */

/** Installs an in-memory `localStorage` and returns its backing map. */
export function stubLocalStorage(): Map<string, string> {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  });
  return store;
}

/** Installs a `matchMedia` that pretends the OS uses the given scheme. */
export function stubSystemColorScheme(scheme: 'light' | 'dark'): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-color-scheme: dark') && scheme === 'dark',
    media: query,
  }));
}
