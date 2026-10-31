import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { I18nService, stripLanguagePrefix } from './i18n.service';

/** Values GA4 accepts as event parameters. */
export type AnalyticsParams = Record<string, string | number | boolean>;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/** Scroll milestones reported once per page, in percent of scrollable height. */
const SCROLL_MILESTONES = [25, 50, 75, 90] as const;

/**
 * Pushes events into the Google Tag Manager `dataLayer`, which forwards them to
 * GA4. Everything here is a no-op on the server: the container only exists in
 * the browser, and a push during SSR would be lost anyway.
 *
 * Beyond page views it records why a visit ends — how long the page was open,
 * how far it was read, and what the visitor last touched — because GA4 on its
 * own only reports that a session stopped, not what preceded it.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly i18n = inject(I18nService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Set once `init()` has run, so a second call cannot double-bind listeners. */
  private started = false;

  private currentPath = '';
  /** The full URL of the open page, captured when it opens. */
  private currentLocation = '';
  private currentTitle = '';
  private openedAt = 0;
  private maxScroll = 0;
  private readonly reportedMilestones = new Set<number>();
  /** The last thing the visitor did, carried into `page_leave`. */
  private lastInteraction = 'none';
  /** Guards against `pagehide` and `visibilitychange` both closing a page. */
  private leaveReported = false;
  private scrollFrame = 0;

  /** Called once from the root component. */
  init(): void {
    if (!this.isBrowser || this.started) {
      return;
    }

    this.started = true;

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.openPage());

    const window = this.document.defaultView;
    if (!window) {
      return;
    }

    window.addEventListener('scroll', this.onScroll, { passive: true });

    // A page can also end without a navigation: the tab is closed, the phone is
    // locked, the visitor switches app. `visibilitychange` is the only one of
    // these that fires reliably on mobile, `pagehide` covers desktop reloads.
    this.document.addEventListener('visibilitychange', () => {
      if (this.document.visibilityState === 'hidden') {
        this.reportLeave('page_hidden');
      }
    });
    window.addEventListener('pagehide', () => this.reportLeave('page_hidden'));

    // Clicks are delegated from the document so no template has to know about
    // analytics. Only links that take the visitor away are interesting here.
    this.document.addEventListener('click', this.onDocumentClick, { capture: true });
  }

  /** Sends one event, named and parameterised the way GA4 will show it. */
  track(event: string, params: AnalyticsParams = {}): void {
    if (!this.isBrowser) {
      return;
    }

    const dataLayer = (window.dataLayer ??= []);
    dataLayer.push({
      event,
      page_path: this.currentPath,
      // Not `language`: GA4 already has a built-in Language dimension taken
      // from the browser, which is a different thing from the site's language.
      site_language: this.i18n.getLanguage(),
      // Sent explicitly on every event: GA4 otherwise takes the address from
      // the browser at send time, which attributes `page_leave` to the page
      // being opened rather than to the one being left.
      page_location: this.currentLocation,
      ...params,
    });
  }

  /**
   * Reports a kitten detail page. Called from the component rather than from
   * the router because the name and breed only exist once the API has answered.
   */
  trackKittenView(kitten: {
    id: string;
    name: string;
    breed?: string;
    sex?: string;
    status?: string;
  }): void {
    this.currentTitle = kitten.name;
    this.track('view_kitten', {
      kitten_id: kitten.id,
      kitten_name: kitten.name,
      kitten_breed: kitten.breed ?? '',
      kitten_sex: kitten.sex ?? '',
      kitten_status: kitten.status ?? '',
    });
    this.noteInteraction('view_kitten');
  }

  /** Records an in-page action, so `page_leave` can name what came last. */
  noteInteraction(name: string): void {
    this.lastInteraction = name;
  }

  private openPage(): void {
    const [pathname] = this.router.url.split('?');
    if (pathname === this.currentPath) {
      return;
    }

    // The page being left is closed first, so its dwell time and read depth are
    // attributed to it and not to the one being opened.
    this.reportLeave('navigation');

    this.currentPath = pathname;
    this.currentLocation = this.document.defaultView?.location.href ?? pathname;
    this.openedAt = Date.now();
    this.maxScroll = 0;
    this.reportedMilestones.clear();
    this.lastInteraction = 'none';
    this.leaveReported = false;

    // SeoService writes the new title from an effect, which runs after this
    // navigation event. Pushing on the next task is what lets the page view
    // carry the page's own title instead of the previous one.
    setTimeout(() => {
      this.currentTitle = this.document.title;
      this.track('virtual_page_view', {
        page_title: this.currentTitle,
        // Lets one report cover both languages: /uk/kittens and /en/kittens
        // share this value, while `page_path` keeps them apart.
        content_group: stripLanguagePrefix(pathname) || '/',
      });
    });
  }

  private reportLeave(reason: 'navigation' | 'page_hidden'): void {
    if (!this.currentPath || this.leaveReported) {
      return;
    }

    this.leaveReported = true;
    this.track('page_leave', {
      exit_reason: reason,
      page_title: this.currentTitle,
      time_on_page: Math.round((Date.now() - this.openedAt) / 1000),
      scroll_depth: this.maxScroll,
      last_interaction: this.lastInteraction,
    });
  }

  private readonly onScroll = (): void => {
    // Scroll fires far more often than it is worth reading layout, so the
    // measurement is collapsed into the next frame.
    if (this.scrollFrame) {
      return;
    }

    this.scrollFrame = requestAnimationFrame(() => {
      this.scrollFrame = 0;
      this.measureScroll();
    });
  };

  private measureScroll(): void {
    const view = this.document.defaultView;
    const element = this.document.documentElement;
    if (!view || !element) {
      return;
    }

    const scrollable = element.scrollHeight - view.innerHeight;
    // A page that does not scroll counts as fully read rather than as 0%.
    const percent =
      scrollable > 0 ? Math.min(100, Math.round((view.scrollY / scrollable) * 100)) : 100;

    if (percent <= this.maxScroll) {
      return;
    }

    this.maxScroll = percent;

    for (const milestone of SCROLL_MILESTONES) {
      if (percent >= milestone && !this.reportedMilestones.has(milestone)) {
        this.reportedMilestones.add(milestone);
        this.track('scroll_depth', { percent_scrolled: milestone });
      }
    }
  }

  private readonly onDocumentClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const link = target.closest('a');
    const href = link?.getAttribute('href');
    if (!link || !href) {
      return;
    }

    const channel = this.contactChannel(href);
    if (channel) {
      this.noteInteraction(`contact_${channel}`);
      this.track('contact_click', { channel, link_url: href });
      return;
    }

    // Any other link to a different host is an exit from the site.
    const host = this.document.defaultView?.location.host;
    if (/^https?:/i.test(href) && host && !href.includes(host)) {
      this.noteInteraction('outbound_click');
      this.track('outbound_click', { link_url: href });
    }
  };

  /** Names the messenger behind a link, or null if it is not a contact link. */
  private contactChannel(href: string): string | null {
    if (href.startsWith('tel:')) return 'phone';
    if (href.startsWith('mailto:')) return 'email';
    if (href.includes('t.me')) return 'telegram';
    if (href.includes('wa.me') || href.includes('whatsapp')) return 'whatsapp';
    if (href.includes('viber')) return 'viber';
    if (href.includes('instagram')) return 'instagram';
    if (href.includes('youtube')) return 'youtube';
    if (href.includes('tiktok')) return 'tiktok';
    return null;
  }
}
