import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { languageResolver } from '@core/i18n/language.resolver';
import { CvDataService } from '@core/services/cv-data.service';
import { PrintService } from '@core/services/print.service';
import { cloneCvData, cvDataServiceWith } from '@app/testing/cv-data.testing';
import { PrintPageComponent } from './print-page.component';

/** Stand-in for the main route: something indexable to navigate back to. */
@Component({ template: '' })
class StubMainComponent {}

describe('PrintPageComponent', () => {
  let printSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    printSpy = vi.fn().mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'vi',
            resolve: { language: languageResolver('vi') },
            children: [
              { path: '', component: StubMainComponent },
              { path: 'print', component: PrintPageComponent },
            ],
          },
          { path: '', component: StubMainComponent },
          { path: 'print', component: PrintPageComponent },
        ]),
        { provide: CvDataService, useValue: cvDataServiceWith(cloneCvData()) },
        { provide: PrintService, useValue: { print: printSpy } },
      ],
    }).compileComponents();
  });

  it('should render the toolbar from the English interface strings', async () => {
    const harness = await RouterTestingHarness.create('/print');
    const compiled = harness.routeNativeElement!;
    const back = compiled.querySelector('.toolbar-back')!;
    expect(back.textContent?.trim()).toBe('Back to the website');
    expect(back.getAttribute('href')).toBe('/');
    expect(compiled.querySelector('.toolbar-field')?.textContent).toContain('Template');
    const options = Array.from(compiled.querySelectorAll('option')).map((option) => [
      option.value,
      option.textContent?.trim(),
    ]);
    expect(options).toEqual([
      ['classic', 'Classic'],
      ['compact', 'Compact'],
    ]);
    expect(compiled.querySelector('.toolbar-export')?.textContent?.trim()).toBe('Export PDF');
    expect(compiled.querySelector('.print-hint')?.textContent).toContain('A4');
  });

  it('should render the toolbar in Vietnamese and stay in Vietnamese on the way back', async () => {
    const harness = await RouterTestingHarness.create('/vi/print?template=compact');
    const compiled = harness.routeNativeElement!;
    const back = compiled.querySelector('.toolbar-back')!;
    expect(back.textContent?.trim()).toBe('Quay lại trang web');
    expect(back.getAttribute('href')).toBe('/vi');
    expect(compiled.querySelector('.toolbar-field')?.textContent).toContain('Mẫu');
    expect(
      Array.from(compiled.querySelectorAll('option')).map((o) => o.textContent?.trim()),
    ).toEqual(['Cổ điển', 'Gọn']);
    expect(compiled.querySelector('.toolbar-export')?.textContent?.trim()).toBe('Xuất PDF');
    expect(compiled.querySelector('.print-hint')?.textContent).not.toContain('The preview');
    // The toggle leads to the same template in English.
    const english = compiled.querySelector('.print-toolbar .lang-toggle[hreflang="en"]');
    expect(english?.getAttribute('href')).toBe('/print?template=compact');
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

  it('should mark the page noindex while active and restore indexing on leave', async () => {
    const meta = TestBed.inject(Meta);
    // The jsdom head persists across tests in this file, so start from a
    // known state: exactly the one robots tag the root shell registers.
    meta.getTags('name="robots"').forEach((tag) => meta.removeTagElement(tag));
    meta.addTag({ name: 'robots', content: 'index, follow' });

    document.head.querySelectorAll('link[rel="canonical"]').forEach((link) => link.remove());
    const canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', 'https://example.com/');
    document.head.appendChild(canonical);

    const harness = await RouterTestingHarness.create('/print');
    expect(meta.getTag('name="robots"')?.content).toBe('noindex, nofollow');
    // Updated in place — a second robots tag would leave the policy ambiguous.
    expect(meta.getTags('name="robots"').length).toBe(1);
    // A canonical naming an indexable page would contradict the noindex.
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();

    await harness.navigateByUrl('/');
    expect(meta.getTag('name="robots"')?.content).toBe('index, follow');
    expect(meta.getTags('name="robots"').length).toBe(1);
  });
});
