import { TestBed } from '@angular/core/testing';
import type { CvData } from '@core/models/cv-data.model';
import { CvDataService } from '@core/services/cv-data.service';
import { CV_DATA_VI } from '@data/cv-data.vi';
import { cloneCvData, cvDataServiceWith } from '@app/testing/cv-data.testing';
import { normalizePrintTemplate, PrintCvComponent } from './print-cv.component';

describe('PrintCvComponent', () => {
  async function render(data: CvData, template?: string): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [PrintCvComponent],
      providers: [{ provide: CvDataService, useValue: cvDataServiceWith(data) }],
    }).compileComponents();
    const fixture = TestBed.createComponent(PrintCvComponent);
    if (template !== undefined) {
      fixture.componentRef.setInput('template', template);
    }
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('should put the name, headline, and contacts before any section content', async () => {
    const compiled = await render(cloneCvData());
    const text = compiled.textContent ?? '';

    // Reading order is DOM order in this theme, so text position proves it:
    // identity block strictly before the first section's content.
    expect(text.indexOf('Nguyen Manh Khuong')).toBeGreaterThanOrEqual(0);
    expect(text.indexOf('Nguyen Manh Khuong')).toBeLessThan(text.indexOf('PAL TECH'));

    // The one h1 is the name, and no heading precedes it.
    const headings = compiled.querySelectorAll('h1, h2, h3, h4');
    expect(headings[0]?.tagName).toBe('H1');
    expect(headings[0]?.textContent).toContain('Nguyen Manh Khuong');
    expect(compiled.querySelectorAll('h1').length).toBe(1);
  });

  it('should give the avatar its square ratio as size attributes', async () => {
    const avatar = (await render(cloneCvData())).querySelector('img.print-avatar')!;
    expect(avatar.getAttribute('width')).toBe('460');
    expect(avatar.getAttribute('height')).toBe('460');
  });

  it('should render the print sections as h2 headings in data order', async () => {
    const data = cloneCvData();
    // Scrambled: order disagrees with array position, and one enabled
    // section is excluded from print.
    data.sections = [
      { id: 'skills', title: 'Skills', order: 2, enabled: true, showInPrint: true },
      { id: 'about', title: 'About', order: 1, enabled: true, showInPrint: true },
      { id: 'experience', title: 'Experience', order: 3, enabled: true, showInPrint: false },
      { id: 'education', title: 'Education', order: 4, enabled: true, showInPrint: true },
    ];
    const compiled = await render(data);
    const titles = Array.from(compiled.querySelectorAll('h2')).map((h2) => h2.textContent?.trim());
    expect(titles).toEqual(['About', 'Skills', 'Education']);
  });

  it('should include print contacts and exclude showInPrint: false ones', async () => {
    const compiled = await render(cloneCvData());
    const text = compiled.textContent ?? '';

    // Print carries what the paper CV carries: email, phone, home address.
    expect(text).toContain('khuongnm.dev@gmail.com');
    expect(text).toContain('0378334899');
    expect(text).toContain('764 National Route 22');
    // The birthday is showInPrint: false and must never reach the sheet.
    expect(text).not.toContain('1991');
  });

  // A PDF's text layer holds only painted text: a label hidden from sight
  // never reaches an ATS, and hidden text in a CV reads as keyword stuffing.
  it('should print every contact as a visible label, a space, and the value', async () => {
    const data = cloneCvData();
    const compiled = await render(data);
    const lines = Array.from(compiled.querySelectorAll('.print-contact')).map(
      (contact) => contact.textContent,
    );
    expect(lines).toEqual(
      data.contacts
        .filter((contact) => contact.showInPrint !== false)
        .map((contact) => `${contact.label}: ${contact.value}`),
    );
    expect(lines).toContain('Email: khuongnm.dev@gmail.com');
    expect(lines).toContain('Phone: 0378334899');
    for (const contact of Array.from(compiled.querySelectorAll('.print-contact'))) {
      const label = contact.querySelector('.print-contact-label')!;
      // The label leads, and nothing marks it for hiding.
      expect(contact.firstElementChild).toBe(label);
      expect(label.className).toBe('print-contact-label');
      expect(label.closest('[aria-hidden]')).toBeNull();
      // The value is a link where the data gives one.
      expect(contact.querySelector('a, span:not([class])')?.textContent).toBeTruthy();
    }
  });

  it('should print no contact icons: the visible label already names the contact', async () => {
    const compiled = await render(cloneCvData());
    expect(compiled.querySelectorAll('.print-contacts i, .print-contact-icon').length).toBe(0);
  });

  it('should format dates with the shared MM/YYYY range pipe', async () => {
    const compiled = await render(cloneCvData());
    const text = compiled.textContent ?? '';
    expect(text).toContain('01/2024 – Present');
    expect(text).toContain('04/2021 – 07/2023');
  });

  it('should join tech stacks into plain comma-separated text', async () => {
    const compiled = await render(cloneCvData());
    const tech = Array.from(compiled.querySelectorAll('.print-tech')).map(
      (line) => line.textContent ?? '',
    );
    expect(tech.some((line) => line.includes('Angular 14, RxJS'))).toBe(true);
  });

  it('should hide experience entries and nested projects flagged showInPrint: false', async () => {
    const data = cloneCvData();
    data.experience[0].showInPrint = false;
    data.experience[1].projects![0].showInPrint = false;
    const compiled = await render(data);
    const text = compiled.textContent ?? '';
    expect(text).not.toContain('PAL TECH');
    expect(text).not.toContain('Stock-related project');
    // The parent entry of the hidden project still prints.
    expect(text).toContain('Freelance');
  });

  it('should render the lead line and labels from the interface strings', async () => {
    const data = cloneCvData();
    data.education[0].gpa = '3.2';
    const compiled = await render(data);
    const lead = compiled.querySelector('.print-about-lead')?.textContent?.trim();
    expect(lead).toMatch(
      new RegExp(`^${data.profile.headline} with \\d+\\+ years of experience\\.$`),
    );
    expect(compiled.textContent).toContain('GPA: 3.2');
    expect(compiled.querySelector('.print-tech-label')?.textContent).toBe('Tech stack:');
    expect(compiled.textContent).toMatch(/Team of \d+/);
  });

  it('should render the employment type label, never the raw enum value', async () => {
    const compiled = await render(cloneCvData());
    const meta = Array.from(compiled.querySelectorAll('.print-entry-meta')).map(
      (line) => line.textContent ?? '',
    );
    expect(meta.some((line) => line.includes('Full-time'))).toBe(true);
    expect(meta.some((line) => line.includes('full-time'))).toBe(false);
  });

  it('should render every interface string in the dataset language', async () => {
    const data = cloneCvData();
    data.ui = structuredClone(CV_DATA_VI.ui);
    data.education[0].gpa = '3.2';
    const compiled = await render(data);
    const text = compiled.textContent ?? '';
    expect(compiled.querySelector('.print-about-lead')?.textContent).toMatch(
      /với \d+\+ năm kinh nghiệm\./,
    );
    expect(text).toContain('01/2024 – Hiện tại');
    expect(text).toContain('Toàn thời gian');
    expect(text).toMatch(/Nhóm \d+ người/);
    expect(compiled.querySelector('.print-tech-label')?.textContent).toBe('Công nghệ sử dụng:');
    expect(text).not.toContain('Tech stack');
    expect(text).not.toContain('Present');
    expect(text).not.toContain('years of experience');
  });

  it('should apply the compact modifier class only for the compact template', async () => {
    const compiled = await render(cloneCvData(), 'compact');
    expect(compiled.querySelector('.print-cv--compact')).toBeTruthy();
  });

  it('should default to the classic template without the modifier class', async () => {
    const compiled = await render(cloneCvData());
    expect(compiled.querySelector('.print-cv')).toBeTruthy();
    expect(compiled.querySelector('.print-cv--compact')).toBeNull();
  });

  describe('normalizePrintTemplate', () => {
    it('should accept known templates and fall back to classic on junk', () => {
      expect(normalizePrintTemplate('compact')).toBe('compact');
      expect(normalizePrintTemplate('classic')).toBe('classic');
      expect(normalizePrintTemplate('shiny')).toBe('classic');
      expect(normalizePrintTemplate('')).toBe('classic');
      expect(normalizePrintTemplate(null)).toBe('classic');
      expect(normalizePrintTemplate(undefined)).toBe('classic');
    });
  });
});
