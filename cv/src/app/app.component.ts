import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { CvDataService } from '@core/services/cv-data.service';
import { buildMetaTags, buildPageTitle } from '@data/meta';

/**
 * Root shell: sets the document title and meta tags from the profile and
 * hands the page over to the router — the web theme on the default route,
 * the A4 print preview on `/print`.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly cvData = inject(CvDataService);

  constructor() {
    // One-shot on purpose: the dataset is fixed for the lifetime of the app
    // today. Revisit with an effect if loading user-supplied data ever needs
    // the tags to follow a store swap.
    const profile = this.cvData.profile();
    this.title.setTitle(buildPageTitle(profile));
    this.meta.addTags(buildMetaTags(profile));
  }
}
