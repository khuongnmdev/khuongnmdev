import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CvDataService } from '@core/services/cv-data.service';
import { PrintService } from '@core/services/print.service';
import { cloneCvData, cvDataServiceWith } from '@app/testing/cv-data.testing';
import { PrintPageComponent } from './print-page.component';

describe('PrintPageComponent', () => {
  let printSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    printSpy = vi.fn().mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'print', component: PrintPageComponent }]),
        { provide: CvDataService, useValue: cvDataServiceWith(cloneCvData()) },
        { provide: PrintService, useValue: { print: printSpy } },
      ],
    }).compileComponents();
  });

  it('should render the classic sheet when no template is requested', async () => {
    const harness = await RouterTestingHarness.create('/print');
    const compiled = harness.routeNativeElement!;
    expect(compiled.querySelector('.print-cv')).toBeTruthy();
    expect(compiled.querySelector('.print-cv--compact')).toBeNull();
  });

  it('should switch the sheet to compact from the query parameter', async () => {
    const harness = await RouterTestingHarness.create('/print?template=compact');
    expect(harness.routeNativeElement!.querySelector('.print-cv--compact')).toBeTruthy();
  });

  it('should fall back to classic on an unknown template value', async () => {
    const harness = await RouterTestingHarness.create('/print?template=shiny');
    const compiled = harness.routeNativeElement!;
    expect(compiled.querySelector('.print-cv')).toBeTruthy();
    expect(compiled.querySelector('.print-cv--compact')).toBeNull();
  });

  it('should write the selected template into the query parameter', async () => {
    const harness = await RouterTestingHarness.create('/print');
    const select = harness.routeNativeElement!.querySelector<HTMLSelectElement>('select')!;

    select.value = 'compact';
    select.dispatchEvent(new Event('change'));
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toContain('template=compact');
    expect(harness.routeNativeElement!.querySelector('.print-cv--compact')).toBeTruthy();
  });

  it('should keep the toolbar and hint out of the printed output via screen-only', async () => {
    const harness = await RouterTestingHarness.create('/print');
    const compiled = harness.routeNativeElement!;
    // The print stylesheet hides `.screen-only` under @media print — the
    // markup contract here is that all chrome carries that class.
    expect(compiled.querySelector('.print-toolbar')?.classList).toContain('screen-only');
    expect(compiled.querySelector('.print-hint')?.classList).toContain('screen-only');
  });

  it('should hand the sheet element to the print service on export', async () => {
    const harness = await RouterTestingHarness.create('/print');
    const compiled = harness.routeNativeElement!;

    compiled.querySelector<HTMLButtonElement>('.toolbar-export')!.click();
    await harness.fixture.whenStable();

    expect(printSpy).toHaveBeenCalledTimes(1);
    const scope = printSpy.mock.calls[0][0] as HTMLElement;
    expect(scope.classList).toContain('print-sheet');
  });
});
