import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { LocationStrategy, TrailingSlashPathLocationStrategy } from '@angular/common';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), provideClientHydration(),
    // Every page is a directory on the static host (`vi/index.html`), which
    // answers a slashless URL with a 301 to the slashed one. Ending every
    // link and address-bar URL with the slash keeps internal links off that
    // redirect and matches the canonical and hreflang URLs.
    { provide: LocationStrategy, useClass: TrailingSlashPathLocationStrategy },
  ]
};
