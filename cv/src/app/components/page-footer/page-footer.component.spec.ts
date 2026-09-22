import { TestBed } from '@angular/core/testing';
import type { CvData } from '@core/models/cv-data.model';
import { CvDataService } from '@core/services/cv-data.service';
import { CV_DATA_VI } from '@data/cv-data.vi';
import { cloneCvData, cvDataServiceWith } from '@app/testing/cv-data.testing';
import { PageFooterComponent } from './page-footer.component';

/** A dataset whose name and edit date differ from the bundled ones. */
function footerData(): CvData {
  const data = cloneCvData();
  data.meta.updatedAt = '2025-03-07';
  data.profile.fullName = 'Test Person';
  return data;
}

describe('PageFooterComponent', () => {
  async function render(data: CvData): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [PageFooterComponent],
      providers: [{ provide: CvDataService, useValue: cvDataServiceWith(data) }],
    }).compileComponents();
    const fixture = TestBed.createComponent(PageFooterComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('should build the English line from the name and the edit date', async () => {
    const compiled = await render(footerData());
    expect(compiled.querySelector('footer')?.textContent?.trim()).toBe(
      '© 2025 Test Person · Last updated 03/2025',
    );
  });

  it('should build the Vietnamese line from the Vietnamese templates', async () => {
    const data = footerData();
    data.ui = structuredClone(CV_DATA_VI.ui);
    const compiled = await render(data);
    expect(compiled.querySelector('footer')?.textContent?.trim()).toBe(
      '© 2025 Test Person · Cập nhật 03/2025',
    );
  });

  it('should take the year from the data, never from the clock', async () => {
    // Prerendering must give the same page whatever day the build runs.
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2031-06-01T00:00:00Z'));
      const compiled = await render(footerData());
      const text = compiled.querySelector('footer')?.textContent ?? '';
      expect(text).toContain('© 2025');
      expect(text).not.toContain('2031');
    } finally {
      vi.useRealTimers();
    }
  });

  it('should hide the separator from assistive technology', async () => {
    const compiled = await render(footerData());
    const separator = compiled.querySelector('.page-footer-separator');
    expect(separator?.textContent).toBe('·');
    expect(separator?.getAttribute('aria-hidden')).toBe('true');
  });
});
