import { buildAlternateLinks, buildOgLocaleAlternates, siteUrlFor } from './meta';

const SITE = 'https://khuongnmdev.github.io/khuongnmdev/';

describe('meta builders', () => {
  describe('with English only', () => {
    it('should name no hreflang alternates', () => {
      expect(buildAlternateLinks(['en'])).toEqual([]);
    });

    it('should name no og:locale:alternate', () => {
      expect(buildOgLocaleAlternates('en', ['en'])).toEqual([]);
    });
  });

  describe('with English and Vietnamese', () => {
    it('should name every language and x-default as absolute hreflang alternates', () => {
      expect(buildAlternateLinks(['en', 'vi'])).toEqual([
        { hreflang: 'en', href: SITE },
        { hreflang: 'vi', href: `${SITE}vi/` },
        { hreflang: 'x-default', href: SITE },
      ]);
    });

    it('should name the other language as the og:locale:alternate', () => {
      expect(buildOgLocaleAlternates('en', ['en', 'vi'])).toEqual(['vi_VN']);
      expect(buildOgLocaleAlternates('vi', ['en', 'vi'])).toEqual(['en_US']);
    });
  });

  it('should give every language its own page URL, published or not', () => {
    expect(siteUrlFor('en')).toBe(SITE);
    expect(siteUrlFor('vi')).toBe(`${SITE}vi/`);
  });
});
