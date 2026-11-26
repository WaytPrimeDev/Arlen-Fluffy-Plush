import { Injectable, REQUEST, afterNextRender, computed, inject, signal } from '@angular/core';

/**
 * Name of the cookie that mirrors the choice for the server. Readable while
 * rendering, so the notice is absent from the very first HTML response for a
 * visitor who has already answered it — no flash of a notice long dismissed.
 */
export const COOKIE_CONSENT_COOKIE = 'cookie_consent';

/** What the visitor has answered, or null while they have not answered yet. */
export type CookieDecision = 'accepted' | 'declined' | null;

/** How long a decision is kept before it is asked again: one year. */
const DECISION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Analytics cookies to clear when consent is refused or withdrawn. */
const ANALYTICS_COOKIE_PATTERN = /^(_ga|_gid|_gat|_gcl)/;

declare global {
  interface Window {
    /**
     * Installed by the loader in `index.html`. Calling it is what lets Google
     * Tag Manager be requested at all; until then the container is never
     * fetched and `analytics_storage` stays denied.
     */
    __grantAnalyticsConsent?: () => void;
  }
}

/**
 * Owns the visitor's cookie decision, and with it whether analytics may run.
 *
 * The decision is stored twice, and the two copies answer different questions.
 * `localStorage` is the record of truth in the browser: it is what a visitor
 * reaches for when they want to reset the choice, so clearing it brings the
 * notice back. The cookie is the copy the *server* can see, because the notice
 * is rendered server-side along with the rest of the page and the server has
 * to know whether to draw it. When storage is reachable and holds nothing, a
 * leftover cookie is treated as stale and expired, so the two cannot disagree.
 *
 * That reconciliation deliberately waits until after hydration. The first
 * render in the browser has to match the one the server sent, and the server
 * can only ever see the cookie — so the cookie is what both of them read.
 * Deciding from `localStorage` while hydrating meant the server could draw the
 * notice and the browser remove it in the same breath (or the reverse), which
 * is exactly the mismatch hydration reports as an error. Reading storage one
 * tick later costs a frame and keeps the two renders identical.
 *
 * Refusing is not a no-op: the tag manager is never requested, and the Google
 * Analytics cookies from an earlier visit are cleared. Withdrawing a consent
 * already given is the same operation — `decline()` — which is what the button
 * on the cookie policy page calls, so a visitor never has to clear their
 * browser's data to take an acceptance back.
 */
@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  /** Present only while server-side rendering. */
  private readonly request = inject(REQUEST, { optional: true });

  private readonly decision = signal<CookieDecision>(null);

  public readonly decision$ = this.decision.asReadonly();

  /** The notice is shown until there is a decision on record. */
  public readonly showNotice = computed(() => this.decision() === null);

  /** Whether analytics may load and report. Only an explicit yes counts. */
  public readonly analyticsAllowed = computed(() => this.decision() === 'accepted');

  constructor() {
    // The cookie, and only the cookie: it is the one copy the server can read,
    // so it is the one that keeps the first browser render equal to the
    // server's.
    const fromCookie = this.decisionFromCookie();
    this.decision.set(fromCookie);

    if (fromCookie === 'accepted') {
      // Already answered on an earlier visit: the container may load as soon
      // as the loader decides to, without waiting for another click.
      this.grantAnalytics();
    }

    // Past hydration the browser's own record takes over. `afterNextRender`
    // never runs on the server, so this is browser-only by construction.
    afterNextRender(() => this.reconcileWithStorage());
  }

  accept(): void {
    this.decision.set('accepted');
    this.remember('accepted');
    this.grantAnalytics();
  }

  decline(): void {
    this.decision.set('declined');
    this.remember('declined');
    // The container was never requested, but a previous visit may have left
    // its cookies behind. Refusing has to take those with it.
    this.clearAnalyticsCookies();
  }

  private grantAnalytics(): void {
    if (typeof window !== 'undefined') {
      window.__grantAnalyticsConsent?.();
    }
  }

  private remember(decision: 'accepted' | 'declined'): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(COOKIE_CONSENT_COOKIE, decision);
      }
    } catch {
      // Blocked storage (private mode, cookies disabled) is not an error here:
      // the choice simply is not remembered, and the notice comes back.
    }

    if (typeof document !== 'undefined') {
      document.cookie = `${COOKIE_CONSENT_COOKIE}=${decision};path=/;max-age=${DECISION_MAX_AGE_SECONDS};samesite=lax`;
    }
  }

  /**
   * Brings the decision into line with `localStorage` once hydration is done.
   *
   * `localStorage` wins wherever it can be read, which is what makes clearing
   * it a way to reset the choice; the cookie answers only where storage cannot
   * be reached at all — on the server, and in a browser that blocks it. When
   * storage is readable and empty while the cookie survives, the cookie is the
   * stale copy and is expired, so the next server-rendered response does not
   * keep hiding a notice the browser has just decided to show again.
   */
  private reconcileWithStorage(): void {
    const stored = this.decisionFromStorage();
    if (stored === 'unavailable') {
      return;
    }

    if (stored === null) {
      if (this.decisionFromCookie() !== null) {
        this.expireDecisionCookie();
      }

      this.decision.set(null);
      return;
    }

    if (stored !== this.decision()) {
      this.decision.set(stored);
      // The cookie is behind: write it back so the next first paint agrees.
      this.remember(stored);
    }

    if (stored === 'accepted') {
      this.grantAnalytics();
    }
  }

  private decisionFromStorage(): CookieDecision | 'unavailable' {
    if (typeof localStorage === 'undefined') {
      return 'unavailable';
    }

    try {
      return asDecision(localStorage.getItem(COOKIE_CONSENT_COOKIE));
    } catch {
      return 'unavailable';
    }
  }

  private decisionFromCookie(): CookieDecision {
    const header = this.request?.headers.get('cookie') ?? this.documentCookie();
    if (!header) {
      return null;
    }

    for (const part of header.split(';')) {
      const [name, ...rest] = part.split('=');
      if (name.trim() === COOKIE_CONSENT_COOKIE) {
        return asDecision(rest.join('=').trim());
      }
    }

    return null;
  }

  private expireDecisionCookie(): void {
    if (typeof document !== 'undefined') {
      document.cookie = `${COOKIE_CONSENT_COOKIE}=;path=/;max-age=0;samesite=lax`;
    }
  }

  /**
   * Google Analytics sets its cookies on the registrable domain, which is not
   * always the host the page is served from, and a cookie can only be expired
   * from the exact domain and path it was set on. Each candidate is tried, and
   * the ones that do not match simply do nothing.
   */
  private clearAnalyticsCookies(): void {
    const header = this.documentCookie();
    if (typeof document === 'undefined' || !header) {
      return;
    }

    const names = header
      .split(';')
      .map((part) => part.split('=')[0].trim())
      .filter((name) => ANALYTICS_COOKIE_PATTERN.test(name));

    const host = document.defaultView?.location.hostname ?? '';
    const registrable = host.replace(/^www\./, '');
    const domains = [null, host, `.${registrable}`];

    for (const name of new Set(names)) {
      for (const domain of domains) {
        document.cookie = `${name}=;path=/;max-age=0;samesite=lax${domain ? `;domain=${domain}` : ''}`;
      }
    }
  }

  private documentCookie(): string | null {
    return typeof document === 'undefined' ? null : document.cookie;
  }
}

function asDecision(value: string | null): CookieDecision {
  return value === 'accepted' || value === 'declined' ? value : null;
}
