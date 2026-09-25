import { Pipe, PipeTransform } from '@angular/core';
import type { YearMonth } from '@core/models/cv-data.model';

/**
 * How much of a `YearMonth` a range shows: `'month'` prints `MM/YYYY`,
 * `'year'` prints the year alone. The data always keeps the month, so
 * sorting stays exact whatever a section chooses to show.
 */
export type DatePrecision = 'month' | 'year';

/** `"2021-04"` → `"04/2021"`. */
export function formatYearMonth(date: YearMonth): string {
  const [year, month] = date.split('-');
  return `${month}/${year}`;
}

/** `"2021-04"` → `"2021"`. */
export function formatYear(date: YearMonth): string {
  const [year] = date.split('-');
  return year;
}

/**
 * `"2021-04"` + `"2023-07"` → `"04/2021 – 07/2023"`;
 * `"2016-01"` + `null` + `"Present"` → `"01/2016 – Present"`.
 *
 * At `'year'` precision, `"2010-09"` + `"2015-12"` → `"2010 – 2015"` and
 * `"2024-09"` + `null` → `"2024 – Present"`. A closed range inside one year
 * collapses to that year (`"2015"`, not `"2015 – 2015"`): the repeated year
 * is an artifact of dropping the months, not information, and reads like a
 * typo on a CV. Month precision never collapses, so its output is unchanged.
 *
 * The separator is an en dash (U+2013), the typographic convention for ranges.
 * `presentText` has no default on purpose: it is a translated interface
 * string, and a silent English fallback would leak into other languages.
 */
export function formatDateRange(
  start: YearMonth,
  end: YearMonth | null,
  presentText: string,
  precision: DatePrecision = 'month',
): string {
  const format = precision === 'year' ? formatYear : formatYearMonth;
  const from = format(start);
  if (end === null) {
    return `${from} – ${presentText}`;
  }
  const to = format(end);
  return precision === 'year' && to === from ? from : `${from} – ${to}`;
}

/**
 * Whole years elapsed since `start`, rounded down and suffixed with `+` —
 * `"2016-01"` seen from 09/2026 yields `"10+"`. Themes derive the figure from
 * `profile.careerStartDate` so the CV never goes stale on its own; a start
 * date in the future clamps to `"0+"`.
 */
export function yearsOfExperience(start: YearMonth, now: Date = new Date()): string {
  const [year, month] = start.split('-').map(Number);
  const elapsedMonths = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  return `${Math.max(0, Math.floor(elapsedMonths / 12))}+`;
}

/**
 * Formats a `YearMonth` range with the one date format shared by every theme:
 * `MM/YYYY – MM/YYYY`, or `MM/YYYY – <present>` while the period is ongoing.
 * A trailing `'year'` shows years only, `YYYY – YYYY` or `YYYY – <present>`.
 *
 * ```html
 * {{ job.startDate | dateRange: job.endDate : ui().present }}
 * {{ study.startDate | dateRange: study.endDate : ui().present : 'year' }}
 * ```
 */
@Pipe({ name: 'dateRange' })
export class DateRangePipe implements PipeTransform {
  transform(
    start: YearMonth,
    end: YearMonth | null,
    presentText: string,
    precision: DatePrecision = 'month',
  ): string {
    return formatDateRange(start, end, presentText, precision);
  }
}
