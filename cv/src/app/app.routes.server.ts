import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Client-only on purpose: the print sheet carries the print-only contacts
    // (phone, home address). Prerendering it would publish them in a static
    // HTML file on the CDN; rendered in the browser they exist only in the
    // visitor's DOM and in the exported PDF. The same holds in every language.
    path: 'print',
    renderMode: RenderMode.Client
  },
  {
    path: 'vi/print',
    renderMode: RenderMode.Client
  },
  // Each language's CV page is prerendered, listed explicitly so that a new
  // route is never published as static HTML by accident.
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'vi',
    renderMode: RenderMode.Prerender
  },
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
