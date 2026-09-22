import { RenderMode, type ServerRoute } from '@angular/ssr';
import { serverRoutesFor } from './app.routes.server';

/** Path → render mode, the part of a server route that decides the output. */
function modes(routes: ServerRoute[]): Record<string, RenderMode> {
  return Object.fromEntries(routes.map((route) => [route.path, route.renderMode]));
}

describe('serverRoutesFor', () => {
  it('should render the print preview of the only published language on the client', () => {
    expect(modes(serverRoutesFor(['en']))).toEqual({
      print: RenderMode.Client,
      '': RenderMode.Prerender,
      // Prerendered as the redirect page the router makes of it.
      vi: RenderMode.Prerender,
      '**': RenderMode.Client,
    });
  });

  it('should prerender every CV page and client-render every print preview of two languages', () => {
    expect(modes(serverRoutesFor(['en', 'vi']))).toEqual({
      print: RenderMode.Client,
      'vi/print': RenderMode.Client,
      '': RenderMode.Prerender,
      vi: RenderMode.Prerender,
      '**': RenderMode.Client,
    });
  });

  it('should render anything it does not list on the client, never by prerender', () => {
    const routes = serverRoutesFor(['en', 'vi']);
    expect(routes.at(-1)).toEqual({ path: '**', renderMode: RenderMode.Client });
    expect(routes.filter((route) => route.renderMode === RenderMode.Prerender)).toHaveLength(2);
  });
});
