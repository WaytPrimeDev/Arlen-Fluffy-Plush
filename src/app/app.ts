import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher.component';
import { TranslatePipe } from './pipes/translate.pipe';
import { FooterComponent } from './components/footer/footer.component';
import { I18nService, languageFromPathname, stripLanguagePrefix } from './services/i18n.service';
import { SeoService } from './services/seo.service';
import { AnalyticsService } from './services/analytics.service';
import type { SeoPageKey } from './services/seo-content';
import { LocalizedPathPipe } from './pipes/localized-path.pipe';

interface SeoTarget {
  key: SeoPageKey;
  path: string;
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LanguageSwitcherComponent,
    TranslatePipe,
    FooterComponent,
    LocalizedPathPipe,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.escape)': 'closeMobileMenu()',
    '(keydown)': 'onDrawerKeydown($event)',
  },
})
export class App {
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly i18n = inject(I18nService);
  private readonly document = inject(DOCUMENT);
  private readonly analytics = inject(AnalyticsService);

  /** Drives the burger button and the slide-in drawer below 821px. */
  protected readonly mobileMenuOpen = signal(false);

  private readonly burger = viewChild<ElementRef<HTMLButtonElement>>('burger');
  private readonly drawer = viewChild<ElementRef<HTMLElement>>('drawer');

  /**
   * The `seo` key the active static route declares, or null on a detail route,
   * which sets its own metadata once the animal has loaded.
   */
  private readonly routeSeo = toSignal<SeoTarget | null>(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.activeRouteSeo()),
    ),
    { initialValue: null },
  );

  constructor() {
    // Binds the GTM page-view, scroll and exit tracking. A no-op during SSR.
    this.analytics.init();

    // The URL owns the language: landing on /en/kittens from a search result
    // has to switch the app over, not just render the Ukrainian copy there.
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      const fromUrl = languageFromPathname(this.router.url.split('?')[0]);
      if (fromUrl && fromUrl !== this.i18n.getLanguage()) {
        this.i18n.setLanguage(fromUrl);
      }

      this.closeMobileMenu();
    });

    // The drawer covers the page, so the page behind it must not scroll with it.
    effect(() => {
      const body = this.document.body;
      if (!body) {
        return;
      }

      body.style.overflow = this.mobileMenuOpen() ? 'hidden' : '';
    });

    // The drawer covers the page it opens over, so the keyboard has to follow
    // it in and come back out to the button that opened it. Without this the
    // first Tab after opening lands on a link behind the overlay, which
    // cannot be seen.
    let wasOpen = false;
    effect(() => {
      const open = this.mobileMenuOpen();

      if (open) {
        this.focusableInDrawer()[0]?.focus();
      } else if (wasOpen) {
        this.burger()?.nativeElement.focus();
      }

      wasOpen = open;
    });

    // Depending on the language signal as well as the route is what re-applies
    // the metadata when a visitor switches language.
    effect(() => {
      const target = this.routeSeo();
      this.i18n.language$();

      if (target) {
        this.seo.applyPage(target.key, target.path);
      }
    });
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  /**
   * Keeps Tab inside the open drawer by wrapping it at either end. The page
   * behind is covered, so letting focus walk into it would leave the visitor
   * driving something they cannot see.
   *
   * Bound on the shell rather than on the drawer, because the drawer holds no
   * focus of its own and a handler on it would be unreachable by keyboard.
   */
  protected onDrawerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.mobileMenuOpen()) {
      return;
    }

    const focusable = this.focusableInDrawer();
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /** The drawer's own stops, in the order Tab visits them. */
  private focusableInDrawer(): HTMLElement[] {
    const element = this.drawer()?.nativeElement;
    if (!element) {
      return [];
    }

    const candidates = element.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );

    return [...candidates].filter((candidate) => candidate.offsetParent !== null);
  }

  private activeRouteSeo(): SeoTarget | null {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const key = route.data['seo'];
    if (typeof key !== 'string') {
      return null;
    }

    // SeoService works in prefix-less paths and adds the language itself, so
    // one call can emit the canonical URL and both hreflang alternates.
    const [pathname] = this.router.url.split('?');
    return { key: key as SeoPageKey, path: stripLanguagePrefix(pathname) };
  }
}
