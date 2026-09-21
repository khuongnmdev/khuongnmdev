import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, PRIMARY_OUTLET, Router, RouterLink, UrlTree } from '@angular/router';
import { filter, map } from 'rxjs';
import { localizedCommands, splitLocalePrefix } from '@core/i18n/localized-url';
import { SUPPORTED_LOCALES, type Locale } from '@core/models/cv-data.model';
import { CvDataService } from '@core/services/cv-data.service';

interface LanguageOption {
  locale: Locale;
  /** Visible text: the language code, `EN` / `VI`. */
  code: string;
  /** Tooltip and accessible name, in the language of the current page. */
  title: string;
  /** The page being viewed, in this language, query parameters kept. */
  target: UrlTree;
  active: boolean;
}

/**
 * Segmented EN | VI control. Each segment is a real link to the page being
 * viewed in that language — `/` ↔ `/vi`, `/print?template=compact` ↔
 * `/vi/print?template=compact` — so the choice travels in the URL: it can be
 * bookmarked, shared, and crawled, and it needs no stored preference.
 */
@Component({
  selector: 'app-language-toggle',
  imports: [RouterLink],
  templateUrl: './language-toggle.component.html',
  styleUrl: './language-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageToggleComponent {
  private readonly router = inject(Router);
  private readonly cvData = inject(CvDataService);

  protected readonly ui = this.cvData.ui;
  protected readonly language = this.cvData.language;

  /** The current URL, refreshed after every navigation (query changes included). */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly options = computed<LanguageOption[]>(() => {
    const current = this.router.parseUrl(this.url());
    const segments = (current.root.children[PRIMARY_OUTLET]?.segments ?? []).map(
      (segment) => segment.path,
    );
    const page = splitLocalePrefix(segments).segments;
    const ui = this.ui();
    return SUPPORTED_LOCALES.map((locale) => ({
      locale,
      code: locale.toUpperCase(),
      title: ui.viewInLanguage[locale],
      target: this.router.createUrlTree(localizedCommands(locale, page), {
        queryParams: current.queryParams,
        fragment: current.fragment ?? undefined,
      }),
      active: locale === this.language(),
    }));
  });
}
