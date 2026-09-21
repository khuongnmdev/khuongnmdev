import { interpolate, InterpolatePipe } from './interpolate.pipe';

describe('interpolate', () => {
  it('fills a placeholder with a number or a string', () => {
    expect(interpolate('Team of {count}', { count: 7 })).toBe('Team of 7');
    expect(interpolate('Nhóm {count} người', { count: '7' })).toBe('Nhóm 7 người');
  });

  it('fills several placeholders in any order, each as often as it appears', () => {
    expect(
      interpolate('{headline} with {years} years — {years}!', { years: '10+', headline: 'Dev' }),
    ).toBe('Dev with 10+ years — 10+!');
  });

  it('leaves a placeholder without a value visible instead of blanking it', () => {
    expect(interpolate('Level {level} of {max}', { level: 3 })).toBe('Level 3 of {max}');
  });

  it('ignores inherited properties and extra values', () => {
    expect(interpolate('{toString}', {})).toBe('{toString}');
    expect(interpolate('No placeholders', { unused: 1 })).toBe('No placeholders');
  });

  it('does not treat a value as a template of its own', () => {
    expect(interpolate('{a}', { a: '{b}', b: 'x' })).toBe('{b}');
  });

  it('is exposed to templates as the interpolate pipe', () => {
    expect(new InterpolatePipe().transform('Level {level} of {max}', { level: 4, max: 5 })).toBe(
      'Level 4 of 5',
    );
  });
});
