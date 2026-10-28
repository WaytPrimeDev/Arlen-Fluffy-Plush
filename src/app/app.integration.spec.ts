import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { I18nService } from './services/i18n.service';
import { SITE } from './services/site-config';

/**
 * Drives the real router through the real shell, which is the part that cannot
 * be checked with HTTP requests against the server: client-side navigation,
 * the language switcher, and whether the metadata keeps up with both.
 */
describe('client-side navigation', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;
  let http: HttpTestingController;

  const host = () => fixture.nativeElement as HTMLElement;

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

  /** The pages fetch on creation; answer whatever they ask for. */
  async function settle(): Promise<void> {
    for (let pass = 0; pass < 6; pass++) {
      await fixture.whenStable();
      const open = http.match(() => true);
      if (open.length === 0) {
        break;
      }
      for (const request of open) {
        request.flush({
          data: [],
          pagination: {
            page: 1,
            perPage: 1000,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        });
      }
    }
    await fixture.whenStable();
  }

  async function go(url: string): Promise<void> {
    await router.navigateByUrl(url);
    await settle();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideLocationMocks(),
      ],
    });
    router = TestBed.inject(Router);
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(I18nService).setLanguage('uk');
    fixture = TestBed.createComponent(App);
    await fixture.whenStable();
  });

  it('renders a prefixed URL and keeps the prefix', async () => {
    await go('/uk/kittens');

    expect(router.url).toBe('/uk/kittens');
    expect(document.documentElement.lang).toBe('uk');
    expect(canonical()).toBe(`${SITE.canonicalOrigin}/uk/kittens`);
  });

  it('adopts the language of the URL it lands on', async () => {
    // Arriving from a search result on the English page must switch the app.
    await go('/en/kittens');

    expect(TestBed.inject(I18nService).getLanguage()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(canonical()).toBe(`${SITE.canonicalOrigin}/en/kittens`);
  });

  it('redirects a URL without a prefix to the active language', async () => {
    await go('/kittens');
    expect(router.url).toBe('/uk/kittens');

    TestBed.inject(I18nService).setLanguage('en');
    await go('/about');
    expect(router.url).toBe('/en/about');
  });

  it('redirects the bare root', async () => {
    await go('/');
    expect(router.url).toBe('/uk');
  });

  it('updates title, canonical and hreflang on every navigation', async () => {
    await go('/uk');
    const home = document.title;
    expect(canonical()).toBe(`${SITE.canonicalOrigin}/uk`);

    await go('/uk/about');
    expect(document.title).not.toBe(home);
    expect(canonical()).toBe(`${SITE.canonicalOrigin}/uk/about`);
    expect(alternates()).toEqual({
      uk: `${SITE.canonicalOrigin}/uk/about`,
      en: `${SITE.canonicalOrigin}/en/about`,
      'x-default': `${SITE.canonicalOrigin}/about`,
    });
  });

  it('switches language through the header button, staying on the same page', async () => {
    await go('/uk/about');
    const ukTitle = document.title;

    const en = Array.from(host().querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'EN',
    );
    if (!en) throw new Error('no EN button in the header');

    en.click();
    await settle();

    expect(router.url).toBe('/en/about');
    expect(TestBed.inject(I18nService).getLanguage()).toBe('en');
    expect(document.title).not.toBe(ukTitle);
    expect(canonical()).toBe(`${SITE.canonicalOrigin}/en/about`);
  });

  it('switches back, and the header links follow the language', async () => {
    await go('/en/kittens');

    const uk = Array.from(host().querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'UK',
    );
    if (!uk) throw new Error('no UK button in the header');

    uk.click();
    await settle();

    expect(router.url).toBe('/uk/kittens');

    const navHrefs = Array.from(host().querySelectorAll('.app-header__nav a'))
      .map((link) => link.getAttribute('href'))
      .filter((href): href is string => href !== null);

    expect(navHrefs.length).toBeGreaterThan(0);
    for (const href of navHrefs) {
      expect(href).toMatch(/^\/uk(\/|$)/);
    }
  });

  it('leaves no internal link without a language prefix', async () => {
    await go('/uk/kittens');

    const internal = Array.from(host().querySelectorAll('a[href^="/"]'))
      .map((link) => link.getAttribute('href') ?? '')
      .filter((href) => href !== '');

    expect(internal.length).toBeGreaterThan(0);
    expect(internal.filter((href) => !/^\/(uk|en)(\/|$)/.test(href))).toEqual([]);
  });

  it('shows a not-found page for an unknown path under a prefix', async () => {
    await go('/uk/does-not-exist');

    // The URL must stay put: redirecting it back to itself is what used to
    // spin the renderer forever.
    expect(router.url).toBe('/uk/does-not-exist');
    expect(host().querySelector('.not-found')).not.toBeNull();
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toContain(
      'noindex',
    );
    expect(canonical()).toBeNull();
    expect(Object.keys(alternates())).toEqual([]);
  });

  it('offers a way back from the not-found page, in the right language', async () => {
    await go('/en/nope');

    expect(TestBed.inject(I18nService).getLanguage()).toBe('en');
    const links = Array.from(host().querySelectorAll('.not-found a')).map((link) =>
      link.getAttribute('href'),
    );
    expect(links).toEqual(['/en', '/en/kittens']);
  });

  it('marks the active nav item', async () => {
    await go('/uk/kittens');

    const active = host().querySelector('.app-header__nav-link--active');
    expect(active?.getAttribute('href')).toBe('/uk/kittens');
  });
});
