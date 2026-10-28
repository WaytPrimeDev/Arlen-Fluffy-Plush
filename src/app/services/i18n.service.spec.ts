import { TestBed } from '@angular/core/testing';
import {
  I18nService,
  LANGUAGES,
  languageFromPathname,
  localizedPath,
  stripLanguagePrefix,
} from './i18n.service';

describe('language prefixes in URLs', () => {
  it('lists Ukrainian first', () => {
    expect([...LANGUAGES]).toEqual(['uk', 'en']);
  });

  describe('languageFromPathname', () => {
    it('reads the leading segment', () => {
      expect(languageFromPathname('/uk')).toBe('uk');
      expect(languageFromPathname('/en')).toBe('en');
      expect(languageFromPathname('/uk/kittens')).toBe('uk');
      expect(languageFromPathname('/en/kittens/abc123')).toBe('en');
    });

    it('tolerates a missing or doubled leading slash', () => {
      expect(languageFromPathname('uk/kittens')).toBe('uk');
      expect(languageFromPathname('//en/about')).toBe('en');
    });

    it('returns null when there is no prefix', () => {
      expect(languageFromPathname('/')).toBeNull();
      expect(languageFromPathname('/kittens')).toBeNull();
      expect(languageFromPathname('')).toBeNull();
    });

    it('does not mistake a longer segment for a language', () => {
      expect(languageFromPathname('/ukraine')).toBeNull();
      expect(languageFromPathname('/english')).toBeNull();
    });
  });

  describe('stripLanguagePrefix', () => {
    it('removes the prefix and keeps the rest', () => {
      expect(stripLanguagePrefix('/uk/kittens')).toBe('/kittens');
      expect(stripLanguagePrefix('/en/kittens/abc123')).toBe('/kittens/abc123');
    });

    it('maps a language root onto the site root', () => {
      expect(stripLanguagePrefix('/uk')).toBe('/');
      expect(stripLanguagePrefix('/en')).toBe('/');
    });

    it('leaves a prefix-less path alone', () => {
      expect(stripLanguagePrefix('/kittens')).toBe('/kittens');
      expect(stripLanguagePrefix('/')).toBe('/');
    });
  });

  describe('localizedPath', () => {
    it('adds the prefix', () => {
      expect(localizedPath('uk', '/kittens')).toBe('/uk/kittens');
      expect(localizedPath('en', 'kittens/abc')).toBe('/en/kittens/abc');
    });

    it('turns the root into the bare prefix', () => {
      expect(localizedPath('uk', '/')).toBe('/uk');
      expect(localizedPath('en', '')).toBe('/en');
    });

    it('round-trips with stripLanguagePrefix', () => {
      for (const path of ['/', '/kittens', '/kittens/abc', '/parents/xyz', '/about']) {
        for (const language of LANGUAGES) {
          expect(stripLanguagePrefix(localizedPath(language, path))).toBe(path);
        }
      }
    });
  });
});

describe('I18nService', () => {
  function service(): I18nService {
    return TestBed.configureTestingModule({}).inject(I18nService);
  }

  it('translates into the active language', () => {
    const i18n = service();

    i18n.setLanguage('uk');
    expect(i18n.t('kittens')).toBe('Кошенята');

    i18n.setLanguage('en');
    expect(i18n.t('kittens')).toBe('Kittens');
  });

  it('has the carousel keys in both languages', () => {
    const i18n = service();
    const keys = [
      'kittenCarousel',
      'scrollToPreviousKittens',
      'scrollToNextKittens',
      'meetOurKittens',
      'meetOurKittensHighlight',
      'viewAllKittens',
    ];

    for (const language of LANGUAGES) {
      i18n.setLanguage(language);
      for (const key of keys) {
        // t() echoes the key back when a translation is missing.
        expect(i18n.t(key)).not.toBe(key);
      }
    }
  });

  it('remembers the choice in a cookie so the server can read it', () => {
    const i18n = service();

    i18n.setLanguage('en');
    expect(document.cookie).toContain('language=en');

    i18n.setLanguage('uk');
    expect(document.cookie).toContain('language=uk');
  });
});
