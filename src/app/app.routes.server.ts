import { RenderMode, ServerRoute } from '@angular/ssr';
import { LOCALIZED_PAGE_PATHS } from './app.routes';
import { LANGUAGES } from './services/i18n.service';

/**
 * Every page is rendered per request. Prerendering would bake one language and
 * one host into the HTML at build time, while the snippet has to follow the URL
 * prefix and the canonical host, and the catalogue needs fresh API data.
 *
 * Listing the pages explicitly earns the entries after them: a URL under a
 * language prefix that matches no page is answered with a real 404 instead of a
 * soft one. The final catch-all carries no status because the routes it covers
 * are the prefix-less ones, which redirect.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  ...LANGUAGES.flatMap((language) =>
    LOCALIZED_PAGE_PATHS.map((page) => ({
      path: page ? `${language}/${page}` : language,
      renderMode: RenderMode.Server as const,
    })),
  ),
  ...LANGUAGES.map((language) => ({
    path: `${language}/**`,
    renderMode: RenderMode.Server as const,
    status: 404,
  })),
  { path: '**', renderMode: RenderMode.Server },
];
