import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { LanguageToggleComponent } from '@app/components/language-toggle/language-toggle.component';
import { localizedCommands } from '@core/i18n/localized-url';
import { PUBLISHED_LOCALES_TOKEN } from '@core/i18n/published-locales';
import { CvDataService } from '@core/services/cv-data.service';
import { PageMetaService } from '@core/services/page-meta.service';
import { PrintService } from '@core/services/print.service';
import {
  normalizePrintTemplate,
  PRINT_TEMPLATES,
  PrintCvComponent,
  PrintTemplate,
} from '@app/components/print-cv/print-cv.component';

/**
 * The print preview route: the A4 sheet rendered on screen, with a
 * screen-only toolbar for switching templates and opening the print dialog.
 * Under `@media print` the toolbar and the preview chrome disappear and only
 * the sheet remains.
 *
 * The selected template lives in the `?template=` query parameter rather
 * than component state, so a template choice survives reloads and can be
 * shared as a link. Unknown values fall back to `classic`.
 *
 * The sheet shows the print-only contacts (phone, home address), so this
 * route is rendered on the client only and flags itself `noindex` while it
 * is active — the data must never sit in a static file or a search index.
 */
@Component({
  selector: 'app-print-page',
  imports: [PrintCvComponent, RouterLink, LanguageToggleComponent],
  templateUrl: './print-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cvData = inject(CvDataService);
  private readonly printService = inject(PrintService);
  private readonly pageMeta = inject(PageMetaService);
  private readonly destroyRef = inject(DestroyRef);

  /** The sheet wrapper — the scope whose images must decode before printing. */
  private readonly sheet = viewChild.required<ElementRef<HTMLElement>>('sheet');

  protected readonly ui = this.cvData.ui;

  protected readonly templates = PRINT_TEMPLATES;

  /** Typed per template, so adding one without a label fails to compile. */
  protected readonly templateLabels = computed<Record<PrintTemplate, string>>(() => ({
    classic: this.ui().printTemplateClassic,
    compact: this.ui().printTemplateCompact,
  }));

  /** The language switch shows only while another language is published. */
  protected readonly hasLanguageChoice = inject(PUBLISHED_LOCALES_TOKEN).length > 1;

  /** Back to the CV page in the language being viewed. */
  protected readonly homeLink = computed(() => localizedCommands(this.cvData.language()));

  /** Query parameter mapped straight onto a signal, junk values normalized. */
  protected readonly template = toSignal(
    this.route.queryParamMap.pipe(map((params) => normalizePrintTemplate(params.get('template')))),
    { initialValue: 'classic' as PrintTemplate },
  );

  /** True while the export waits for fonts, images, and icons. */
  protected readonly exporting = signal(false);

  constructor() {
    // Out of search indexes while active — robots noindex, no canonical —
    // and back to the site defaults once the visitor leaves.
    this.destroyRef.onDestroy(this.pageMeta.excludeFromIndex());
  }

  protected onTemplateChange(event: Event): void {
    const selected = normalizePrintTemplate((event.target as HTMLSelectElement).value);
    void this.router.navigate([], {
      relativeTo: this.route,
      // The default keeps the URL clean; only non-default choices appear.
      queryParams: { template: selected === 'classic' ? null : selected },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected async exportPdf(): Promise<void> {
    if (this.exporting()) {
      return;
    }
    this.exporting.set(true);
    try {
      await this.printService.print(this.sheet().nativeElement);
    } finally {
      this.exporting.set(false);
    }
  }
}
