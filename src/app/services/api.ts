import { InjectionToken } from '@angular/core';

/**
 * Every call is written against our own origin, so the browser never names the
 * backend host. What stands behind `/api/...` is the proxy in `server.ts`:
 * `vercel.json` sends every path to the SSR function, `/api` included, and the
 * function forwards it to `API_BACKEND_ORIGIN`. There is no edge `rewrites`
 * rule for `/api` — an earlier revision of this comment claimed one, which
 * made it look as though the proxy were dead code on production. It is the only
 * thing serving the API there, so `API_ORIGIN` has to be set in the deployment
 * environment or every call answers 502.
 *
 * While developing, the same paths are served by this proxy under `npm run
 * serve:ssr:Arlen-Fluffy-Plush`, or by the dev-server `proxyConfig`.
 */
export const API_PATH = '/api';

/**
 * Absolute origin the `/api` paths are resolved against while rendering on the
 * server, where `fetch` has no page to resolve a relative URL against. Provided
 * only in `app.config.server.ts`, which keeps the backend host out of the
 * browser bundle.
 */
export const API_ORIGIN = new InjectionToken<string>('API_ORIGIN');
