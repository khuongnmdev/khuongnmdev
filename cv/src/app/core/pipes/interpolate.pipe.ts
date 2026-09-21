import { Pipe, PipeTransform } from '@angular/core';

/** Values for the `{name}` placeholders of a template string. */
export type InterpolationValues = Readonly<Record<string, string | number>>;

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Fills the `{name}` placeholders of a translated template:
 * `interpolate('Team of {count}', { count: 7 })` → `"Team of 7"`.
 *
 * Whole sentences are translated as templates rather than assembled from
 * fragments, because word order differs between languages. A placeholder
 * without a value is left as written, so a missing value shows up on the page
 * instead of vanishing silently.
 */
export function interpolate(template: string, values: InterpolationValues): string {
  return template.replace(PLACEHOLDER, (placeholder, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : placeholder,
  );
}

/**
 * Template adapter for `interpolate`:
 *
 * ```html
 * {{ ui().teamSize | interpolate: { count: project.teamSize } }}
 * ```
 */
@Pipe({ name: 'interpolate' })
export class InterpolatePipe implements PipeTransform {
  transform(template: string, values: InterpolationValues): string {
    return interpolate(template, values);
  }
}
