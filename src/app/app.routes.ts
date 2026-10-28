import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { I18nService, LANGUAGES, type Language } from './services/i18n.service';

/**
 * The pages themselves. Mounted once per language, so `/uk/kittens` and
 * `/en/kittens` are separate URLs that Google can index independently and
 * cross-reference with hreflang.
 */
const localizedRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    data: { seo: 'home' },
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'kittens',
    data: { seo: 'kittens' },
    loadComponent: () =>
      import('./pages/kittens/kittens.component').then((m) => m.KittensComponent),
  },
  {
    path: 'kittens/:id',
    loadComponent: () => import('./pages/kitten/kitten.component').then((m) => m.KittenComponent),
  },
  {
    path: 'parents',
    data: { seo: 'parents' },
    loadComponent: () =>
      import('./pages/parents/parents.component').then((m) => m.ParentsComponent),
  },
  {
    path: 'parents/:id',
    loadComponent: () => import('./pages/parent/parent.component').then((m) => m.ParentComponent),
  },
  {
    path: 'about',
    data: { seo: 'about' },
    loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
  },
  {
    path: 'contacts',
    data: { seo: 'contacts' },
    loadComponent: () =>
      import('./pages/contacts/contacts.component').then((m) => m.ContactsComponent),
  },
  {
    // Must stay inside the language subtree. Without it an unknown path such as
    // /uk/typo falls through to the top-level catch-all, which would redirect
    // it to /uk/typo again — a redirect loop that hangs the renderer.
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];

/** The page paths of one language, used to declare the server routes. */
export const LOCALIZED_PAGE_PATHS = localizedRoutes
  .map((route) => route.path ?? '')
  .filter((path) => path !== '**');

/**
 * Sends a URL that carries no language prefix to the preferred language. The
 * server answers such requests with a real 302 before Angular runs; this covers
 * the same links when they are followed inside the app.
 */
function toPreferredLanguage(segments: readonly { path: string }[] = []): string {
  const language: Language = inject(I18nService).getLanguage();
  const rest = segments.map((segment) => segment.path).filter(Boolean);
  return ['', language, ...rest].join('/');
}

export const routes: Routes = [
  ...LANGUAGES.map((language) => ({ path: language, children: localizedRoutes })),
  { path: '', pathMatch: 'full', redirectTo: () => toPreferredLanguage() },
  { path: '**', redirectTo: (data) => toPreferredLanguage(data.url) },
];
