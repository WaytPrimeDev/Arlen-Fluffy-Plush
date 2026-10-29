/**
 * The SSR entry point for Vercel.
 *
 * `src/server.ts` runs the site locally and on any Node host: it listens on a
 * port. Vercel runs no long-lived process, so the same Express app is handed
 * over here as a single function instead, and `vercel.json` rewrites every
 * request that is not a file on the CDN to it.
 *
 * The import is the built bundle rather than the source, because `server.ts`
 * reaches for the Angular build manifest that only exists after `ng build`.
 */
import { reqHandler } from '../dist/Arlen-Fluffy-Plush/server/server.mjs';

/** The query key `vercel.json` smuggles the requested path through. */
const PATH_KEY = '__ssrPath';

/** Only used to parse a path-and-query string; never sent anywhere. */
const PARSE_BASE = 'http://localhost';

export default function handler(req, res) {
  req.url = requestedUrl(req.url ?? '/');
  return reqHandler(req, res);
}

/**
 * The URL the visitor actually asked for.
 *
 * A rewrite resolves its destination before the function sees it, so the path
 * can arrive as the destination (`/api/ssr`) rather than as what was typed.
 * The rewrite therefore passes the original path in a query parameter, which
 * is put back here — every URL the site builds, from the canonical tag to the
 * language redirect, is derived from it, so a wrong path is a wrong page.
 *
 * Without that parameter the URL is already the real one and is left alone,
 * which is what happens when the function is reached directly.
 */
function requestedUrl(rawUrl) {
  const received = new URL(rawUrl, PARSE_BASE);
  const requestedPath = received.searchParams.get(PATH_KEY);

  if (!requestedPath) {
    return rawUrl;
  }

  received.searchParams.delete(PATH_KEY);

  // The visitor's own query string survives the rewrite and belongs to the
  // page: `?lang=en` is read while rendering, and `?page=2` by the catalogue.
  const requested = new URL(requestedPath, PARSE_BASE);
  for (const [key, value] of received.searchParams) {
    requested.searchParams.append(key, value);
  }

  return `${requested.pathname}${requested.search}`;
}
