import { DateRangePipe, formatYearMonth, yearsOfExperience } from './date-range.pipe';

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
});

describe('formatYearMonth', () => {
  it('turns YYYY-MM into MM/YYYY', () => {
    expect(formatYearMonth('2024-01')).toBe('01/2024');
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
