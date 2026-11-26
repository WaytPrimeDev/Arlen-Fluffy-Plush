/**
 * Where the `/api` paths actually go. Server-side only — imported by
 * `server.ts` and `app.config.server.ts`, never by anything the browser
 * downloads, so the backend host is not part of the client bundle.
 *
 * `API_ORIGIN` names it. The localhost default is for development only: every
 * `/api` call on a deployment goes through the proxy in `server.ts`, so a
 * deployment without this variable set answers the whole catalogue with a 502.
 * That is a silent failure worth one noisy line in the build log, which is
 * what the warning below is for.
 */
 * `API_ORIGIN` names it, and the public backend is the default: a deployment
 * that never sets the variable still serves the whole catalogue. Set it to
 * point the site at another backend — `http://localhost:3000` to develop
 * against a local one, a staging host to try a release against that.
 */
export const API_BACKEND_ORIGIN = (
  process.env['API_ORIGIN'] ?? 'https://arlenback.onrender.com'
).replace(/\/+$/, '');
