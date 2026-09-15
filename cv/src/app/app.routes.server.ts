import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Client-only on purpose: the print sheet carries the print-only contacts
    // (phone, home address). Prerendering it would publish them in a static
    // HTML file on the CDN; rendered in the browser they exist only in the
    // visitor's DOM and in the exported PDF.
    path: 'print',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
