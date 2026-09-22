import { TestBed } from '@angular/core/testing';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@core/models/cv-data.model';
import { PUBLISHED_LOCALES, PUBLISHED_LOCALES_TOKEN } from './published-locales';

describe('PUBLISHED_LOCALES', () => {
  it('should publish the default language, first', () => {
    expect(PUBLISHED_LOCALES[0]).toBe(DEFAULT_LOCALE);
  });

  it('should publish supported languages only, in their order, each once', () => {
    const order = PUBLISHED_LOCALES.map((locale) => SUPPORTED_LOCALES.indexOf(locale));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect(order).toEqual([...new Set(order)].sort((a, b) => a - b));
  });

  it('should not be changed at runtime', () => {
    expect(Object.isFrozen(PUBLISHED_LOCALES)).toBe(true);
  });

  it('should be what the injection token provides by default', () => {
    expect(TestBed.inject(PUBLISHED_LOCALES_TOKEN)).toBe(PUBLISHED_LOCALES);
  });
});
