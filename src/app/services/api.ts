import { InjectionToken } from '@angular/core';

/**
 * Every call is written against our own origin, so the browser never names the
 * backend host: `/api/...` is rewritten to it by the `rewrites` entry in
 * `vercel.json` in production, and by the `/api` proxy in `server.ts` (or the
 * dev-server `proxyConfig`) while developing.
 */
export const API_PATH = '/api';

/**
 * Absolute origin the `/api` paths are resolved against while rendering on the
 * server, where `fetch` has no page to resolve a relative URL against. Provided
 * only in `app.config.server.ts`, which keeps the backend host out of the
 * browser bundle.
 */
export const API_ORIGIN = new InjectionToken<string>('API_ORIGIN');
