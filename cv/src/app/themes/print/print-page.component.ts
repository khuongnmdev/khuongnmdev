import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { PrintService } from '@core/services/print.service';
import {
  normalizePrintTemplate,
  PRINT_TEMPLATES,
  PrintCvComponent,
  PrintTemplate,
} from './print-cv.component';

/**
 * The print preview route: the A4 sheet rendered on screen, with a
 * screen-only toolbar for switching templates and opening the print dialog.
 * Under `@media print` the toolbar and the preview chrome disappear and only
 * the sheet remains.
 *
 * The selected template lives in the `?template=` query parameter rather
 * than component state, so a template choice survives reloads and can be
 * shared as a link. Unknown values fall back to `classic`.
 */
@Component({
  selector: 'app-print-page',
  imports: [PrintCvComponent, RouterLink],
  templateUrl: './print-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly printService = inject(PrintService);

  /** The sheet wrapper — the scope whose images must decode before printing. */
  private readonly sheet = viewChild.required<ElementRef<HTMLElement>>('sheet');

  protected readonly templates = PRINT_TEMPLATES;

  /** Query parameter mapped straight onto a signal, junk values normalized. */
  protected readonly template = toSignal(
    this.route.queryParamMap.pipe(map((params) => normalizePrintTemplate(params.get('template')))),
    { initialValue: 'classic' as PrintTemplate },
  );

  /** True while the export waits for fonts, images, and icons. */
  protected readonly exporting = signal(false);

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
