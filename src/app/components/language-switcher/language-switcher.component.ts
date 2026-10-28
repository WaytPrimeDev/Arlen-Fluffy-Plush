import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import {
  I18nService,
  localizedPath,
  stripLanguagePrefix,
  type Language,
} from '../../services/i18n.service';

@Component({
  selector: 'app-language-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="language-switcher">
      <button
        class="lang-btn"
        [class.active]="i18n.getLanguage() === 'en'"
        (click)="switchLanguage('en')"
      >
        EN
      </button>
      <span class="separator">|</span>
      <button
        class="lang-btn"
        [class.active]="i18n.getLanguage() === 'uk'"
        (click)="switchLanguage('uk')"
      >
        UK
      </button>
    </div>
  `,
  styles: `
    .language-switcher {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .lang-btn {
      background: none;
      border: none;
      padding: 8px 12px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      color: #666;
      transition: all 0.3s ease;
      border-radius: 4px;

      &:hover {
        color: #333;
        background-color: #f0f0f0;
      }

      &.active {
        color: #333;
        background-color: #e8e8e8;
        font-weight: 700;
      }
    }

    .separator {
      color: #ddd;
      margin: 0 4px;
    }
  `,
})
export class LanguageSwitcherComponent {
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  /**
   * Switching language means moving to the same page under the other prefix:
   * each language lives at its own URL so both can be indexed, which makes the
   * language a property of the URL rather than of hidden state.
   */
  switchLanguage(lang: Language) {
    this.i18n.setLanguage(lang);

    const [pathname, query] = this.router.url.split('?');
    this.router.navigateByUrl(
      localizedPath(lang, stripLanguagePrefix(pathname)) + (query ? `?${query}` : ''),
    );
  }
}
