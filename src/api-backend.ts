/**
 * Where the `/api` paths actually go. Server-side only — imported by
 * `server.ts` and `app.config.server.ts`, never by anything the browser
 * downloads, so the backend host is not part of the client bundle.
 *
 * `API_ORIGIN` overrides it for a staging backend; the sitemap and the proxy
 * then follow the same host as the rendered pages.
 */
export const API_BACKEND_ORIGIN = (
  process.env['API_ORIGIN'] ?? 'https://arlenback-production.up.railway.app'
).replace(/\/+$/, '');
