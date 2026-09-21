import { Pipe, PipeTransform } from '@angular/core';
import type { YearMonth } from '@core/models/cv-data.model';

/** `"2021-04"` → `"04/2021"`. */
export function formatYearMonth(date: YearMonth): string {
  const [year, month] = date.split('-');
  return `${month}/${year}`;
}

/**
 * `"2021-04"` + `"2023-07"` → `"04/2021 – 07/2023"`;
 * `"2016-01"` + `null` → `"01/2016 – Present"`.
 *
 * The separator is an en dash (U+2013), the typographic convention for ranges.
 */
export function formatDateRange(
  start: YearMonth,
  end: YearMonth | null,
  presentText: string = 'Present',
): string {
  return `${formatYearMonth(start)} – ${end === null ? presentText : formatYearMonth(end)}`;
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
 * `MM/YYYY – MM/YYYY`, or `MM/YYYY – Present` while the period is ongoing.
 *
 * ```html
 * {{ job.startDate | dateRange: job.endDate }}
 * ```
 */
@Pipe({ name: 'dateRange' })
export class DateRangePipe implements PipeTransform {
  transform(start: YearMonth, end: YearMonth | null, presentText: string = 'Present'): string {
    return formatDateRange(start, end, presentText);
  }
}
