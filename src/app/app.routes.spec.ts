import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, Route } from '@angular/router';
import { routes } from './app.routes';
import { I18nService, LANGUAGES } from './services/i18n.service';

/** The redirect callbacks need an injection context and a route snapshot. */
function runRedirect(route: Route, segments: string[] = []): string {
  const redirectTo = route.redirectTo;
  if (typeof redirectTo !== 'function') {
    throw new Error('route does not redirect through a function');
  }

  const snapshot = {
    url: segments.map((path) => ({ path, parameters: {} })),
  } as unknown as ActivatedRouteSnapshot;

  return String(TestBed.runInInjectionContext(() => redirectTo(snapshot)));
}

describe('app routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('mounts the pages under every language prefix', () => {
    for (const language of LANGUAGES) {
      const subtree = routes.find((route) => route.path === language);
      expect(subtree, `no subtree for ${language}`).toBeDefined();
      expect(subtree?.children?.length).toBeGreaterThan(0);
    }
  });

  it('catches unknown paths inside each language, not at the root', () => {
    // A top-level catch-all would redirect /uk/typo to /uk/typo forever and
    // hang the renderer, so each language subtree must end in its own.
    for (const language of LANGUAGES) {
      const children = routes.find((route) => route.path === language)?.children ?? [];
      const last = children[children.length - 1];

      expect(last?.path, `${language} has no catch-all`).toBe('**');
      expect(last?.redirectTo, `${language} catch-all must not redirect`).toBeUndefined();
      expect(last?.loadComponent).toBeDefined();
    }
  });

  it('never redirects a prefixed URL back to itself', () => {
    TestBed.inject(I18nService).setLanguage('uk');

    const catchAll = routes.find((route) => route.path === '**');
    if (!catchAll) throw new Error('no catch-all');

    // The root catch-all only ever sees prefix-less paths, but if it were
    // reached with one that already has a prefix the result must still change.
    for (const segments of [['kittens'], ['about'], ['parents', 'id']]) {
      const target = runRedirect(catchAll, segments);
      expect(target).not.toBe('/' + segments.join('/'));
      expect(target.startsWith('/uk/')).toBe(true);
    }
  });

  it('gives both languages the same set of pages', () => {
    const paths = LANGUAGES.map((language) =>
      routes
        .find((route) => route.path === language)
        ?.children?.map((child) => child.path)
        .sort(),
    );

    expect(paths[0]).toEqual(paths[1]);
    expect(paths[0]).toEqual(
      ['', '**', 'about', 'contacts', 'kittens', 'kittens/:id', 'parents', 'parents/:id'].sort(),
    );
  });

  it('declares no page outside a language prefix', () => {
    const pages = routes.filter((route) => route.loadComponent || route.component);
    expect(pages).toEqual([]);
  });

  it('tags the static pages for SEO copy', () => {
    const children = routes.find((route) => route.path === 'uk')?.children ?? [];
    const tagged = children.filter((child) => child.data?.['seo']).map((child) => child.path);

    expect(tagged.sort()).toEqual(['', 'about', 'contacts', 'kittens', 'parents']);
  });

  describe('redirects for URLs without a prefix', () => {
    function rootRoute(): Route {
      const route = routes.find((candidate) => candidate.path === '' && candidate.redirectTo);
      if (!route) throw new Error('no root redirect');
      return route;
    }

    function catchAllRoute(): Route {
      const route = routes.find((candidate) => candidate.path === '**');
      if (!route) throw new Error('no catch-all redirect');
      return route;
    }

    it('sends the root to the active language', () => {
      TestBed.inject(I18nService).setLanguage('uk');
      expect(runRedirect(rootRoute())).toBe('/uk');

      TestBed.inject(I18nService).setLanguage('en');
      expect(runRedirect(rootRoute())).toBe('/en');
    });

    it('keeps the rest of the path when redirecting', () => {
      TestBed.inject(I18nService).setLanguage('uk');
      expect(runRedirect(catchAllRoute(), ['kittens'])).toBe('/uk/kittens');
      expect(runRedirect(catchAllRoute(), ['kittens', 'abc123'])).toBe('/uk/kittens/abc123');

      TestBed.inject(I18nService).setLanguage('en');
      expect(runRedirect(catchAllRoute(), ['parents', 'xyz'])).toBe('/en/parents/xyz');
    });

    it('orders the catch-all last so it cannot shadow a language', () => {
      const catchAllIndex = routes.findIndex((route) => route.path === '**');
      expect(catchAllIndex).toBe(routes.length - 1);

      for (const language of LANGUAGES) {
        expect(routes.findIndex((route) => route.path === language)).toBeLessThan(catchAllIndex);
      }
    });
  });
});
