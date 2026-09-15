import { ApplicationRef, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { stubLocalStorage, stubSystemColorScheme } from '@app/testing/browser-apis.testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let storage: Map<string, string>;

  beforeEach(() => {
    storage = stubLocalStorage();
    stubSystemColorScheme('light');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute('data-theme');
  });

  /** The preference is applied after the first render; force one. */
  function createService(): ThemeService {
    const service = TestBed.inject(ThemeService);
    TestBed.inject(ApplicationRef).tick();
    return service;
  }

  it('should default to light and leave the document alone when the system scheme is light', () => {
    const service = createService();
    expect(service.theme()).toBe('light');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('should follow a dark system scheme without pinning data-theme', () => {
    // The stylesheet handles the no-choice case itself via the media query,
    // so only the signal — not the document — may change.
    stubSystemColorScheme('dark');
    const service = createService();
    expect(service.theme()).toBe('dark');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('should apply a stored choice over the system scheme and pin it on the document', () => {
    storage.set('cv-theme', 'dark');
    const service = createService();
    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should ignore a corrupt stored value', () => {
    storage.set('cv-theme', 'sepia');
    const service = createService();
    expect(service.theme()).toBe('light');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('should set data-theme and persist the choice on toggle', () => {
    const service = createService();

    service.toggle();
    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(storage.get('cv-theme')).toBe('dark');

    service.toggle();
    expect(service.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(storage.get('cv-theme')).toBe('light');
  });

  it('should survive without any storage at all', () => {
    // jsdom's own state: no localStorage on the window. The toggle must not
    // throw; only persistence is lost.
    vi.unstubAllGlobals();
    const service = createService();
    service.toggle();
    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should stay silent on the server: no document writes, no storage access', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const service = createService();

    service.toggle();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(storage.size).toBe(0);
  });
});
