import { TestBed } from '@angular/core/testing';
import { I18nService, LANGUAGES, type Language } from './i18n.service';
import { SeoService } from './seo.service';
import { SITE } from './site-config';

describe('SeoService', () => {
  let seo: SeoService;
  let i18n: I18nService;

  function meta(selector: string): string | null {
    return document.head.querySelector(selector)?.getAttribute('content') ?? null;
  }

  function canonical(): string | null {
    return document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null;
  }

  function alternates(): Record<string, string> {
    const found: Record<string, string> = {};
    for (const link of Array.from(document.head.querySelectorAll('link[rel="alternate"]'))) {
      found[link.getAttribute('hreflang') ?? ''] = link.getAttribute('href') ?? '';
    }
    return found;
  }

  function structuredData(): { '@graph': Record<string, unknown>[] } {
    const script = document.getElementById('app-structured-data');
    return JSON.parse(script?.textContent ?? '{}');
  }

  function types(): string[] {
    return structuredData()['@graph'].map((node) => {
      const type = node['@type'];
      // The cattery node carries two types; the first one names it.
      return String(Array.isArray(type) ? type[0] : type);
    });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    seo = TestBed.inject(SeoService);
    i18n = TestBed.inject(I18nService);
  });

  it('puts the language prefix in the canonical URL', () => {
    i18n.setLanguage('uk');
    seo.applyPage('kittens', '/kittens');
    expect(canonical()).toBe(`${SITE.canonicalOrigin}/uk/kittens`);

    i18n.setLanguage('en');
    seo.applyPage('kittens', '/kittens');
    expect(canonical()).toBe(`${SITE.canonicalOrigin}/en/kittens`);
  });

  it('writes a different title and snippet per language', () => {
    const seen = new Map<Language, { title: string; description: string }>();

    for (const language of LANGUAGES) {
      i18n.setLanguage(language);
      seo.applyPage('home', '/');
      seen.set(language, {
        title: document.title,
        description: meta('meta[name="description"]') ?? '',
      });
    }

    const uk = seen.get('uk')!;
    const en = seen.get('en')!;

    expect(uk.title).not.toBe(en.title);
    expect(uk.description).not.toBe(en.description);
    expect(uk.title).toContain(SITE.name);
    expect(en.title).toContain(SITE.name);
    // Ukrainian copy, not Russian: these letters do not exist in Ukrainian.
    expect(uk.title + uk.description).not.toMatch(/[ыъэё]/);
    expect(uk.description.length).toBeGreaterThan(70);
    expect(en.description.length).toBeGreaterThan(70);
  });

  it('declares a complete, self-referencing hreflang set', () => {
    i18n.setLanguage('uk');
    seo.applyPage('kittens', '/kittens');

    expect(alternates()).toEqual({
      uk: `${SITE.canonicalOrigin}/uk/kittens`,
      en: `${SITE.canonicalOrigin}/en/kittens`,
      'x-default': `${SITE.canonicalOrigin}/kittens`,
    });
  });

  it('keeps the hreflang set identical across languages', () => {
    i18n.setLanguage('uk');
    seo.applyPage('about', '/about');
    const fromUk = alternates();

    i18n.setLanguage('en');
    seo.applyPage('about', '/about');

    expect(alternates()).toEqual(fromUk);
  });

  it('does not accumulate stale alternates across navigations', () => {
    i18n.setLanguage('uk');
    seo.applyPage('kittens', '/kittens');
    seo.applyPage('about', '/about');
    seo.applyPage('contacts', '/contacts');

    const links = document.head.querySelectorAll('link[rel="alternate"]');
    expect(links.length).toBe(LANGUAGES.length + 1);
    expect(alternates()['uk']).toBe(`${SITE.canonicalOrigin}/uk/contacts`);
  });

  it('fills the Open Graph and Twitter tags', () => {
    i18n.setLanguage('uk');
    seo.applyPage('home', '/');

    expect(meta('meta[property="og:title"]')).toBe(document.title);
    expect(meta('meta[property="og:url"]')).toBe(`${SITE.canonicalOrigin}/uk`);
    expect(meta('meta[property="og:locale"]')).toBe('uk_UA');
    expect(meta('meta[property="og:site_name"]')).toBe(SITE.name);
    expect(meta('meta[name="twitter:title"]')).toBe(document.title);

    i18n.setLanguage('en');
    seo.applyPage('home', '/');
    expect(meta('meta[property="og:locale"]')).toBe('en_US');
  });

  it('keeps a non-canonical host out of the index', () => {
    // jsdom serves the test from localhost, which is not the canonical origin.
    i18n.setLanguage('uk');
    seo.applyPage('home', '/');

    expect(meta('meta[name="robots"]')).toBe('noindex, nofollow');
  });

  it('emits valid JSON-LD for a static page', () => {
    i18n.setLanguage('uk');
    seo.applyPage('kittens', '/kittens');

    const graph = structuredData()['@graph'];
    expect(types()).toEqual(['Organization', 'WebSite', 'WebPage', 'BreadcrumbList']);

    const organization = graph[0];
    expect(organization['name']).toBe(SITE.name);
    expect(organization['url']).toBe(SITE.canonicalOrigin);
    // The names the cattery is searched by, including the former Jimdo site,
    // are what tie those queries to this domain.
    expect(organization['alternateName']).toContain('Arlen Cat');
    expect(organization['sameAs']).toContain(SITE.legacySite);
    // Contact details are published only while the site itself shows them.
    expect(organization['telephone']).toBe(SITE.telephone);
    expect(organization['email']).toBe(SITE.email);

    const breadcrumbs = graph[3]['itemListElement'] as Record<string, unknown>[];
    expect(breadcrumbs.map((crumb) => crumb['item'])).toEqual([
      `${SITE.canonicalOrigin}/uk`,
      `${SITE.canonicalOrigin}/uk/kittens`,
    ]);
  });

  it('describes a kitten page with its own copy and photo', () => {
    i18n.setLanguage('uk');
    seo.applyKitten({
      path: '/kittens/abc123',
      name: 'Мурчик',
      breed: 'Британська',
      color: 'блакитний',
      age: '11 червня 2026 р.',
      image: 'https://images.example.com/kitten.jpg',
      status: 'available',
      prices: ['25000 грн', null],
    });

    expect(document.title).toContain('Мурчик');
    expect(canonical()).toBe(`${SITE.canonicalOrigin}/uk/kittens/abc123`);
    expect(meta('meta[property="og:image"]')).toBe('https://images.example.com/kitten.jpg');
    expect(meta('meta[name="twitter:card"]')).toBe('summary_large_image');
    expect(types()).toEqual(['Organization', 'WebSite', 'ItemPage', 'Product', 'BreadcrumbList']);

    const offer = structuredData()['@graph'][3]['offers'] as Record<string, unknown>;
    expect(offer['availability']).toBe('https://schema.org/InStock');
    expect(offer['price']).toBe(25000);
    expect(offer['priceCurrency']).toBe('UAH');

    // The formatted date already ends in a period; the sentence must not double it.
    expect(meta('meta[name="description"]')).not.toContain('..');
    expect(alternates()['en']).toBe(`${SITE.canonicalOrigin}/en/kittens/abc123`);
  });

  it('leaves the price out of an offer it cannot read', () => {
    i18n.setLanguage('uk');
    seo.applyKitten({
      path: '/kittens/abc123',
      name: 'Мурчик',
      breed: 'Регдол',
      color: 'сіл-пойнт',
      age: '',
      image: null,
      status: 'reserved',
      prices: ['договірна', null],
    });

    const offer = structuredData()['@graph'][3]['offers'] as Record<string, unknown>;
    expect(offer['availability']).toBe('https://schema.org/PreOrder');
    expect(offer['price']).toBeUndefined();
    expect(offer['priceCurrency']).toBeUndefined();
  });

  it('names the cattery the way searchers do on every static page', () => {
    for (const language of LANGUAGES) {
      i18n.setLanguage(language);

      for (const page of ['home', 'kittens', 'parents', 'about', 'contacts'] as const) {
        seo.applyPage(page, page === 'home' ? '/' : `/${page}`);
        const copy = `${document.title} ${meta('meta[name="description"]')}`;
        expect(copy).toContain('Arlen');
        expect(copy.toLowerCase()).toMatch(/розплідник|cattery/);
      }
    }
  });

  it('describes a parent page', () => {
    i18n.setLanguage('en');
    seo.applyParent({
      path: '/parents/xyz',
      name: 'Luna',
      breed: 'British Shorthair',
      color: 'blue',
      image: null,
    });

    expect(document.title).toContain('Luna');
    expect(canonical()).toBe(`${SITE.canonicalOrigin}/en/parents/xyz`);
    expect(meta('meta[property="og:type"]')).toBe('profile');
    // No photo of its own, so the page falls back to the site's social cover.
    expect(meta('meta[property="og:image"]')).toBe(
      `${SITE.canonicalOrigin}${SITE.socialImagePath}`,
    );
    expect(meta('meta[name="twitter:card"]')).toBe('summary_large_image');
  });

  it('sets the lang attribute of the document', () => {
    i18n.setLanguage('uk');
    seo.applyPage('home', '/');
    expect(document.documentElement.lang).toBe('uk');

    i18n.setLanguage('en');
    seo.applyPage('home', '/');
    expect(document.documentElement.lang).toBe('en');
  });
});
