import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LocalizedPathPipe } from '../../pipes/localized-path.pipe';
import { CookieConsentService } from '../../services/cookie-consent.service';

/**
 * The cookie notice, pinned to the bottom of the page until the visitor
 * answers it. It carries both answers — accept, which lets analytics load, and
 * refuse, which keeps the tag manager from ever being requested — and a link
 * to the full policy, so the notice itself can stay short.
 *
 * The two buttons are the same size and sit side by side on purpose: a refusal
 * that is harder to find than an acceptance is not really a choice.
 *
 * Deliberately not a modal: it neither covers the page nor traps focus, so a
 * visitor can read, scroll and navigate while it is open and is never blocked
 * by it. It is rendered server-side as well, which is why a visitor who has
 * already answered never sees it appear and disappear.
 *
 * Because it is not a modal, it must not cover anything either. A fixed bar
 * takes up no room in the layout, so it sat on top of the end of the footer —
 * the contact links and the cookie-policy link included — until it was
 * answered. The spacer below it is an ordinary in-flow element of the same
 * height, which gives the document that room back. Its height is measured
 * rather than guessed, since the notice wraps to two or three lines depending
 * on the language and the viewport; the CSS `min-height` is the estimate that
 * holds for the server-rendered first paint, before anything can be measured.
 */
@Component({
  selector: 'app-cookie-banner',
  imports: [RouterLink, TranslatePipe, LocalizedPathPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (consent.showNotice()) {
      <aside #bar class="cookie-banner" role="region" aria-labelledby="cookie-banner-title">
        <div class="cookie-banner__inner">
          <div class="cookie-banner__copy">
            <h2 class="cookie-banner__title" id="cookie-banner-title">
              {{ 'cookieBannerTitle' | translate }}
            </h2>
            <p class="cookie-banner__text">
              {{ 'cookieBannerText' | translate }}
              <a class="cookie-banner__link" [routerLink]="'/cookies' | locPath">{{
                'cookiePolicy' | translate
              }}</a>
            </p>
          </div>

          <div class="cookie-banner__actions">
            <button
              type="button"
              class="cookie-banner__button cookie-banner__button--decline"
              (click)="consent.decline()"
            >
              {{ 'cookieBannerDecline' | translate }}
            </button>
            <button
              type="button"
              class="cookie-banner__button cookie-banner__button--accept"
              (click)="consent.accept()"
            >
              {{ 'cookieBannerAccept' | translate }}
            </button>
          </div>
        </div>
      </aside>

      <div
        class="cookie-banner__spacer"
        aria-hidden="true"
        [style.minHeight.px]="barHeight() || null"
      ></div>
    }
  `,
  styles: `
    .cookie-banner {
      position: fixed;
      inset: auto 0 0;
      /* Above the sticky header (200), below the mobile drawer's overlay (250).
         The drawer is the one part of the shell that really is modal — it
         traps focus and marks everything else inert — so while it is open the
         notice belongs behind its scrim with the rest of the page, not in
         front of it. Anywhere else, the notice is the frontmost thing. */
      z-index: 210;
      background: #0f172a;
      color: #cbd5e1;
      border-top: 1px solid #1e293b;
      box-shadow: 0 -10px 30px rgb(15 23 42 / 25%);
      /* Clears the home-bar area on iOS, where the bottom inset is non-zero. */
      padding-bottom: env(safe-area-inset-bottom);
    }

    /* Holds open the room the fixed bar occupies. The height is written in by
       the component once the bar has been measured; this is the fallback the
       first server-rendered paint uses, which covers the two-line notice both
       languages produce on a phone. */
    .cookie-banner__spacer {
      min-height: 190px;
    }

    @media (min-width: 720px) {
      .cookie-banner__spacer {
        min-height: 104px;
      }
    }

    .cookie-banner__inner {
      max-width: 1240px;
      margin: 0 auto;
      padding: 1.1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .cookie-banner__title {
      font-family: 'Playfair Display', serif;
      font-size: 1.05rem;
      color: #fff;
      margin: 0 0 0.35rem;
    }

    .cookie-banner__text {
      margin: 0;
      font-size: 0.88rem;
      line-height: 1.65;
      color: #94a3b8;
    }

    .cookie-banner__link {
      color: #c4b5fd;
      text-decoration: underline;
      white-space: nowrap;

      &:hover {
        color: #ddd6fe;
      }

      &:focus-visible {
        outline: 3px solid #c4b5fd;
        outline-offset: 3px;
        border-radius: 4px;
      }
    }

    .cookie-banner__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }

    .cookie-banner__button {
      flex: 1 1 auto;
      min-height: 44px;
      padding: 0.7rem 1.6rem;
      border-radius: 999px;
      font-size: 0.92rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;

      &:hover {
        transform: translateY(-1px);
      }

      &:focus-visible {
        outline: 3px solid #c4b5fd;
        outline-offset: 3px;
      }
    }

    .cookie-banner__button--accept {
      border: 2px solid #7356a8;
      background: #7356a8;
      color: #fff;

      &:hover {
        border-color: #5f4590;
        background: #5f4590;
      }
    }

    /* Outlined rather than filled, but the same size and in the same row: the
       border and the light ink keep it at 8:1 against the bar, so it reads as
       a real second option and not as fine print. */
    .cookie-banner__button--decline {
      border: 2px solid #475569;
      background: transparent;
      color: #e2e8f0;

      &:hover {
        border-color: #94a3b8;
        background: #1e293b;
      }
    }

    @media (min-width: 720px) {
      .cookie-banner__inner {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 2rem;
      }

      .cookie-banner__actions {
        flex-shrink: 0;
      }

      .cookie-banner__button {
        flex: 0 0 auto;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .cookie-banner__button {
        transition: none;

        &:hover {
          transform: none;
        }
      }
    }
  `,
})
export class CookieBannerComponent {
  protected readonly consent = inject(CookieConsentService);

  private readonly bar = viewChild<ElementRef<HTMLElement>>('bar');

  /** The bar's measured height, or 0 before it has been measured. */
  protected readonly barHeight = signal(0);

  constructor() {
    // Browser-only, which is the right place for it: there is nothing to
    // measure while rendering on the server, and the CSS fallback covers that
    // first paint. The observer follows a notice that reflows — a language
    // switch, a rotation, a window drag — rather than measuring once.
    afterRenderEffect((onCleanup) => {
      const element = this.bar()?.nativeElement;
      if (!element) {
        this.barHeight.set(0);
        return;
      }

      const observer = new ResizeObserver(() => this.barHeight.set(element.offsetHeight));
      observer.observe(element);
      onCleanup(() => observer.disconnect());
    });
  }
}
