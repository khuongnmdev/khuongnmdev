import { TestBed } from '@angular/core/testing';
import type { CvData } from '@core/models/cv-data.model';
import { CV_DATA } from '@data/cv-data';
import { CV_DATA_LOADERS } from '@data/cv-data.loaders';
import { CvDataService } from './cv-data.service';

/** A valid dataset whose sections arrive unsorted, with one disabled entry. */
function withScrambledSections(): CvData {
  const data = structuredClone(CV_DATA);
  data.sections = [
    { id: 'skills', title: 'Skills', order: 4, enabled: true, showInPrint: true },
    { id: 'about', title: 'About', order: 1, enabled: true, showInPrint: true },
    { id: 'projects', title: 'Projects', order: 2, enabled: false, showInPrint: true },
    { id: 'experience', title: 'Experience', order: 3, enabled: true, showInPrint: false },
  ];
  return data;
}

describe('CvDataService', () => {
  let service: CvDataService;

  beforeEach(() => {
    service = TestBed.inject(CvDataService);
  });

  it('seeds the store from the bundled dataset', () => {
    expect(service.data()).toEqual(CV_DATA);
    expect(service.profile().fullName).toBe(CV_DATA.profile.fullName);
  });

  it('exposes only enabled sections, sorted by order', () => {
    expect(service.loadFrom(withScrambledSections())).toEqual({ ok: true });
    expect(service.sections().map((s) => s.id)).toEqual(['about', 'experience', 'skills']);
  });

  it('narrows print sections to enabled ones flagged showInPrint', () => {
    expect(service.loadFrom(withScrambledSections())).toEqual({ ok: true });
    // 'experience' is enabled but not printable; 'projects' is printable but
    // disabled — neither may reach the print output.
    expect(service.printSections().map((s) => s.id)).toEqual(['about', 'skills']);
  });

  it('replaces the whole store when given valid data', () => {
    const next = structuredClone(CV_DATA);
    next.profile.fullName = 'Replaced Name';
    expect(service.loadFrom(next)).toEqual({ ok: true });
    expect(service.profile().fullName).toBe('Replaced Name');
  });

  it('rejects an invalid union value and leaves the store untouched', () => {
    // The exact case the build-time structure check cannot see: the shape is
    // right, only the union value is wrong.
    const broken = structuredClone(CV_DATA) as any;
    broken.contacts[0].type = 'emial';

    const result = service.loadFrom(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(['contacts[0].type: "emial" is not a ContactType']);
    }
    expect(service.data()).toEqual(CV_DATA);
  });

  it('starts in the default language', () => {
    expect(service.language()).toBe('en');
  });

  it('takes the language from a loaded payload when it is a supported one', () => {
    const vietnamese = structuredClone(CV_DATA);
    vietnamese.meta.locale = 'vi';
    expect(service.loadFrom(vietnamese)).toEqual({ ok: true });
    expect(service.language()).toBe('vi');

    // An unsupported locale still loads, but cannot claim a language the
    // site has no URL for.
    const french = structuredClone(CV_DATA);
    french.meta.locale = 'fr';
    expect(service.loadFrom(french)).toEqual({ ok: true });
    expect(service.language()).toBe('vi');
  });

  it('titles a section from the data, falling back to the interface default', () => {
    const data = structuredClone(CV_DATA);
    data.sections = [
      { id: 'skills', title: 'Toolbox', order: 1, enabled: true, showInPrint: true },
    ];
    service.loadFrom(data);
    expect(service.sectionTitle('skills')).toBe('Toolbox');
    expect(service.sectionTitle('hobbies')).toBe(data.ui.sectionTitles.hobbies);
  });

  it('loads the bundled Vietnamese dataset through the real lazy loader', async () => {
    await service.useLanguage('vi');
    expect(service.language()).toBe('vi');
    expect(service.data().meta.locale).toBe('vi');
    expect(service.ui().present).toBe('Hiện tại');

    await service.useLanguage('en');
    expect(service.language()).toBe('en');
    expect(service.data()).toEqual(CV_DATA);
  });
});

describe('CvDataService language loading', () => {
  /** A promise whose settlement the test controls. */
  function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((settle) => (resolve = settle));
    return { promise, resolve };
  }

  function vietnamese(): CvData {
    const data = structuredClone(CV_DATA);
    data.meta.locale = 'vi';
    data.ui.present = 'Hiện tại';
    return data;
  }

  let en: ReturnType<typeof vi.fn<() => Promise<unknown>>>;
  let vn: ReturnType<typeof vi.fn<() => Promise<unknown>>>;

  function setup(): CvDataService {
    TestBed.configureTestingModule({
      providers: [{ provide: CV_DATA_LOADERS, useValue: { en, vi: vn } }],
    });
    return TestBed.inject(CvDataService);
  }

  beforeEach(() => {
    en = vi.fn(() => Promise.resolve(structuredClone(CV_DATA)));
    vn = vi.fn(() => Promise.resolve(vietnamese()));
  });

  it('does not load a language until it is asked for', () => {
    const service = setup();
    expect(vn).not.toHaveBeenCalled();
    expect(en).not.toHaveBeenCalled();
    expect(service.language()).toBe('en');
  });

  it('loads, validates, and applies a language on first use', async () => {
    const service = setup();
    await service.useLanguage('vi');
    expect(vn).toHaveBeenCalledTimes(1);
    expect(service.language()).toBe('vi');
    expect(service.ui().present).toBe('Hiện tại');
  });

  it('caches each language, sharing one load between concurrent requests', async () => {
    const service = setup();
    await Promise.all([service.useLanguage('vi'), service.useLanguage('vi')]);
    await service.useLanguage('en');
    await service.useLanguage('vi');
    expect(vn).toHaveBeenCalledTimes(1);
    expect(en).toHaveBeenCalledTimes(1);
    expect(service.language()).toBe('vi');
  });

  it('rejects an invalid dataset and leaves the store untouched', async () => {
    const broken = vietnamese() as any;
    broken.contacts[0].type = 'emial';
    vn.mockResolvedValue(broken);
    const service = setup();

    await expect(service.useLanguage('vi')).rejects.toThrow(
      'contacts[0].type: "emial" is not a ContactType',
    );
    expect(service.language()).toBe('en');
    expect(service.data()).toEqual(CV_DATA);
  });

  it('rejects a dataset that declares a different language', async () => {
    vn.mockResolvedValue(structuredClone(CV_DATA));
    const service = setup();
    await expect(service.useLanguage('vi')).rejects.toThrow('declares meta.locale "en"');
    expect(service.language()).toBe('en');
  });

  it('does not cache a failed load, so the next request retries', async () => {
    vn.mockRejectedValueOnce(new Error('chunk failed to load'));
    const service = setup();
    await expect(service.useLanguage('vi')).rejects.toThrow('chunk failed to load');
    await service.useLanguage('vi');
    expect(vn).toHaveBeenCalledTimes(2);
    expect(service.language()).toBe('vi');
  });

  it('applies only the latest of overlapping requests', async () => {
    const slow = deferred<unknown>();
    vn.mockReturnValue(slow.promise);
    const service = setup();

    const first = service.useLanguage('vi');
    await service.useLanguage('en');
    slow.resolve(vietnamese());
    await first;

    // The slow Vietnamese load finished last but was superseded.
    expect(service.language()).toBe('en');
    expect(service.data()).toEqual(CV_DATA);
  });
});
