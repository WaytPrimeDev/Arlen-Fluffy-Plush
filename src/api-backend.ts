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
const configuredOrigin = process.env['API_ORIGIN'];

if (!configuredOrigin && process.env['NODE_ENV'] === 'production') {
  console.warn(
    '[api-backend] API_ORIGIN is not set; /api requests will be proxied to ' +
      'http://localhost:3000 and will fail. Set API_ORIGIN in the deployment environment.',
  );
}

export const API_BACKEND_ORIGIN = (configuredOrigin ?? 'https://arlenback.onrender.com').replace(
  /\/+$/,
  '',
);
