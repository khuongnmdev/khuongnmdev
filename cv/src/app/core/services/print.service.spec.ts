import { TestBed } from '@angular/core/testing';
import { DOCUMENT, PLATFORM_ID } from '@angular/core';
import { PrintService } from './print.service';

/**
 * A stand-in for the injected DOCUMENT: a real jsdom body for the DOM
 * queries, a controllable font-ready promise, and a spied `print`.
 */
function fakeDocument(options: { fontsReady?: Promise<unknown>; withFontsApi?: boolean } = {}) {
  const body = document.createElement('body');
  const printSpy = vi.fn();
  const doc = {
    body,
    defaultView: { print: printSpy },
    ...(options.withFontsApi === false
      ? {}
      : { fonts: { ready: options.fontsReady ?? Promise.resolve() } }),
  } as unknown as Document;
  return { doc, body, printSpy };
}

function setupService(platform: string, doc: Document): PrintService {
  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: platform },
      { provide: DOCUMENT, useValue: doc },
    ],
  });
  return TestBed.inject(PrintService);
}

describe('PrintService', () => {
  it('should do nothing on the server platform', async () => {
    const { doc, printSpy } = fakeDocument();
    const service = setupService('server', doc);

    await service.print();

    expect(printSpy).not.toHaveBeenCalled();
  });

  it('should open the print dialog in the browser once ready', async () => {
    const { doc, printSpy } = fakeDocument();
    const service = setupService('browser', doc);

    await service.print();

    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('should wait for fonts before printing', async () => {
    let resolveFonts!: () => void;
    const fontsReady = new Promise<void>((resolve) => (resolveFonts = resolve));
    const { doc, printSpy } = fakeDocument({ fontsReady });
    const service = setupService('browser', doc);

    const pending = service.print();
    await new Promise((resolve) => setTimeout(resolve, 0));
    // Negative check: were the await missing, this would already have fired.
    expect(printSpy).not.toHaveBeenCalled();

    resolveFonts();
    await pending;
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('should wait for the images in scope to decode before printing', async () => {
    let resolveDecode!: () => void;
    const decoded = new Promise<void>((resolve) => (resolveDecode = resolve));
    const { doc, body, printSpy } = fakeDocument();
    body.innerHTML = '<img alt="">';
    body.querySelector('img')!.decode = () => decoded;
    const service = setupService('browser', doc);

    const pending = service.print(body);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(printSpy).not.toHaveBeenCalled();

    resolveDecode();
    await pending;
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('should print anyway when an image fails to decode', async () => {
    const { doc, body, printSpy } = fakeDocument();
    body.innerHTML = '<img alt="">';
    body.querySelector('img')!.decode = () => Promise.reject(new Error('broken image'));
    const service = setupService('browser', doc);

    await service.print(body);

    // A missing avatar degrades the sheet; it must not block the export.
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('should tolerate a document without the font loading API', async () => {
    const { doc, printSpy } = fakeDocument({ withFontsApi: false });
    const service = setupService('browser', doc);

    await service.print();

    expect(printSpy).toHaveBeenCalledTimes(1);
  });
});
