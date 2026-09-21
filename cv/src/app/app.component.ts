import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { CvDataService } from '@core/services/cv-data.service';
import { PageMetaService } from '@core/services/page-meta.service';

/**
 * Root shell: keeps the document language, title, and meta tags in step with
 * the active dataset, and hands the page over to the router — the web theme
 * on the default route, the A4 print preview on `print`, each under its
 * language prefix.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly cvData = inject(CvDataService);
  private readonly pageMeta = inject(PageMetaService);

  /**
   * Becomes true once the first navigation has resolved the page's language.
   * Until then the store holds the eagerly bundled default dataset, which
   * would briefly stamp English onto a Vietnamese page while its dataset
   * loads.
   */
  private readonly navigated = toSignal(
    inject(Router).events.pipe(
      filter((event) => event instanceof NavigationEnd),
      take(1),
      map(() => true),
    ),
    { initialValue: false },
  );

  constructor() {
    // Reactive on purpose: it follows every language switch, on the server
    // while prerendering each language's page and in the browser alike.
    effect(() => {
      if (this.navigated()) {
        this.pageMeta.apply(this.cvData.language(), this.cvData.data());
      }
    });
  }
}
