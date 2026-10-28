import { FetchBackend, type HttpEvent, type HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_ORIGIN, API_PATH } from './api';

/**
 * Gives the `/api` paths an origin while rendering on the server. `fetch` there
 * has no document to resolve `/api/cats/kittens` against and would reject the
 * request outright, so the first paint would arrive without any data.
 *
 * This is a backend rather than an interceptor on purpose. Interceptors run
 * above the one `provideClientHydration` installs for the transfer cache, which
 * hashes the request URL it sees into the cache key. Rewriting the URL up there
 * made the server store its responses under absolute-URL keys while the browser
 * looked them up under the relative URLs it asks for — every lookup missed, so
 * the hydrated page refetched the whole catalogue and flashed its skeletons
 * over content that was already on screen. Down here the rewrite happens after
 * the cache has taken its key, so both sides agree on it.
 *
 * `API_ORIGIN` is unset in the browser, where the path resolves against the
 * page and has to stay relative to go through the proxy. Requests to anything
 * other than our own API are never touched.
 *
 * It extends `FetchBackend` rather than wrapping one because `withFetch()` is
 * detected with `backend instanceof FetchBackend`: a wrapper that delegates to
 * fetch still trips the NG02801 warning on every server render.
 */
@Injectable()
export class ApiOriginBackend extends FetchBackend {
  private readonly origin = inject(API_ORIGIN, { optional: true });

  override handle(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    const shouldRewrite = this.origin && request.url.startsWith(`${API_PATH}/`);

    return super.handle(
      shouldRewrite ? request.clone({ url: `${this.origin}${request.url}` }) : request,
    );
  }
}
