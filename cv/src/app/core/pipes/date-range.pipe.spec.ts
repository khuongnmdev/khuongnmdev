import {
  DateRangePipe,
  formatDateRange,
  formatYear,
  formatYearMonth,
  yearsOfExperience,
} from './date-range.pipe';

describe('DateRangePipe', () => {
  const pipe = new DateRangePipe();

  it('formats a closed range as MM/YYYY – MM/YYYY', () => {
    expect(pipe.transform('2021-04', '2023-07', 'Present')).toBe('04/2021 – 07/2023');
  });

  it('formats an open range with the given present text', () => {
    expect(pipe.transform('2016-01', null, 'Present')).toBe('01/2016 – Present');
    expect(pipe.transform('2016-01', null, 'Hiện tại')).toBe('01/2016 – Hiện tại');
  });

  it('separates with an en dash, not a hyphen', () => {
    const result = pipe.transform('2021-04', '2023-07', 'Present');
    expect(result).toContain(' – ');
    expect(result).not.toContain(' - ');
  });

  it('passes a year precision through to the formatter', () => {
    expect(pipe.transform('2010', '2015', 'Present', 'year')).toBe('2010 – 2015');
    expect(pipe.transform('2024', null, 'Hiện tại', 'year')).toBe('2024 – Hiện tại');
  });
});

describe('formatDateRange', () => {
  it('defaults to month precision', () => {
    expect(formatDateRange('2021-04', '2023-07', 'Present')).toBe('04/2021 – 07/2023');
    expect(formatDateRange('2021-04', '2023-07', 'Present', 'month')).toBe('04/2021 – 07/2023');
  });

  it('formats a YYYY range at year precision, with the same en dash', () => {
    const result = formatDateRange('2010', '2015', 'Present', 'year');
    expect(result).toBe('2010 – 2015');
    expect(result).toContain(' – ');
    expect(result).not.toContain(' - ');
  });

  it('drops the months of a YYYY-MM range at year precision', () => {
    const result = formatDateRange('2021-04', '2023-07', 'Present', 'year');
    expect(result).toBe('2021 – 2023');
    expect(result).not.toMatch(/\d{2}\//);
  });

  it('keeps the present text for an ongoing range at year precision', () => {
    expect(formatDateRange('2024', null, 'Present', 'year')).toBe('2024 – Present');
    expect(formatDateRange('2024', null, 'Hiện tại', 'year')).toBe('2024 – Hiện tại');
  });

  it('collapses a closed range inside one year to that year', () => {
    expect(formatDateRange('2015', '2015', 'Present', 'year')).toBe('2015');
    expect(formatDateRange('2015-02', '2015-11', 'Present', 'year')).toBe('2015');
  });

  it('never collapses an ongoing range, even one that started this year', () => {
    const year = String(new Date().getFullYear());
    expect(formatDateRange(year, null, 'Present', 'year')).toBe(`${year} – Present`);
  });

  it('never collapses at month precision', () => {
    expect(formatDateRange('2015-02', '2015-11', 'Present')).toBe('02/2015 – 11/2015');
    expect(formatDateRange('2015-03', '2015-03', 'Present')).toBe('03/2015 – 03/2015');
  });
});

describe('formatYearMonth', () => {
  it('turns YYYY-MM into MM/YYYY', () => {
    expect(formatYearMonth('2024-01')).toBe('01/2024');
  });
});

describe('formatYear', () => {
  it('returns a YYYY year unchanged', () => {
    expect(formatYear('2010')).toBe('2010');
  });

  it('keeps only the year of YYYY-MM', () => {
    expect(formatYear('2024-01')).toBe('2024');
  });
});

describe('yearsOfExperience', () => {
  it('rounds down to whole years', () => {
    expect(yearsOfExperience('2016-01', new Date(2026, 8, 15))).toBe('10+');
  });

  it('does not round up just before an anniversary', () => {
    expect(yearsOfExperience('2016-01', new Date(2025, 11, 31))).toBe('9+');
  });

  it('counts a completed year from the anniversary month', () => {
    expect(yearsOfExperience('2016-01', new Date(2026, 0, 1))).toBe('10+');
  });

  it('clamps a future start date to zero', () => {
    expect(yearsOfExperience('2030-01', new Date(2026, 8, 15))).toBe('0+');
  });
});
