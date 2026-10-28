import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { I18nService, stripLanguagePrefix } from '../../services/i18n.service';
import { SeoService } from '../../services/seo.service';
import { LocalizedPathPipe } from '../../pipes/localized-path.pipe';

/**
 * Shown for a URL under a language prefix that names no page. It exists so that
 * such a URL resolves to something instead of falling through to the top-level
 * redirect, which would send it back to itself.
 */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink, LocalizedPathPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="not-found">
      <p class="not-found__code" aria-hidden="true">404</p>
      <h1 class="not-found__title">{{ i18n.t('notFoundTitle') }}</h1>
      <p class="not-found__text">{{ i18n.t('notFoundText') }}</p>
      <div class="not-found__actions">
        <a class="not-found__button" [routerLink]="'/' | locPath">{{ i18n.t('home') }}</a>
        <a class="not-found__link" [routerLink]="'/kittens' | locPath">
          {{ i18n.t('availableKittensTab') }}
        </a>
      </div>
    </section>
  `,
  styles: `
    .not-found {
      max-width: 560px;
      margin: 0 auto;
      padding: 6rem 1.25rem;
      text-align: center;
    }

    .not-found__code {
      margin: 0;
      font-family: 'Playfair Display', serif;
      font-size: clamp(3.5rem, 12vw, 6rem);
      line-height: 1;
      color: rgb(115 86 168 / 28%);
    }

    .not-found__title {
      margin: 0.75rem 0 0;
      font-family: 'Playfair Display', serif;
      font-size: clamp(1.5rem, 5vw, 2rem);
      color: var(--text-primary);
    }

    .not-found__text {
      margin: 0.85rem 0 0;
      color: var(--text-muted);
    }

    .not-found__actions {
      margin-top: 2rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.85rem;
      justify-content: center;
    }

    .not-found__button,
    .not-found__link {
      padding: 0.7rem 1.4rem;
      border-radius: 14px;
      text-decoration: none;
      font-weight: 600;
    }

    .not-found__button {
      background: var(--brand-purple);
      color: #fff;
    }

    .not-found__link {
      border: 1px solid rgb(115 86 168 / 28%);
      color: var(--brand-purple);
    }

    .not-found__button:focus-visible,
    .not-found__link:focus-visible {
      outline: 3px solid var(--brand-purple);
      outline-offset: 2px;
    }
  `,
})
export class NotFoundComponent {
  protected readonly i18n = inject(I18nService);
  private readonly seo = inject(SeoService);
  private readonly router = inject(Router);

  constructor() {
    const [pathname] = this.router.url.split('?');
    this.seo.applyNotFound(stripLanguagePrefix(pathname));
  }
}
