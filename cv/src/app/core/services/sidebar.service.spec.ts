import { ApplicationRef, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { stubLocalStorage } from '@app/testing/browser-apis.testing';
import { SidebarService } from './sidebar.service';

describe('SidebarService', () => {
  let storage: Map<string, string>;

  beforeEach(() => {
    storage = stubLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** The stored state is applied after the first render; force one. */
  function createService(): SidebarService {
    const service = TestBed.inject(SidebarService);
    TestBed.inject(ApplicationRef).tick();
    return service;
  }

  it('should default to expanded', () => {
    const service = createService();
    expect(service.collapsed()).toBe(false);
  });

  it('should toggle and persist the collapsed state', () => {
    const service = createService();

    service.toggle();
    expect(service.collapsed()).toBe(true);
    expect(storage.get('cv-sidebar-collapsed')).toBe('true');

    service.toggle();
    expect(service.collapsed()).toBe(false);
    expect(storage.get('cv-sidebar-collapsed')).toBe('false');
  });

  it('should restore a stored collapsed state', () => {
    storage.set('cv-sidebar-collapsed', 'true');
    const service = createService();
    expect(service.collapsed()).toBe(true);
  });

  it('should survive without any storage at all', () => {
    // jsdom's own state: no localStorage on the window. The toggle must not
    // throw; only persistence is lost.
    vi.unstubAllGlobals();
    const service = createService();
    service.toggle();
    expect(service.collapsed()).toBe(true);
  });

  it('should stay silent on the server: default state, no storage access', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    storage.set('cv-sidebar-collapsed', 'true');
    const service = createService();

    expect(service.collapsed()).toBe(false);
    service.toggle();
    // The in-memory state may flip, but the server never writes storage.
    expect(storage.get('cv-sidebar-collapsed')).toBe('true');
  });
});
