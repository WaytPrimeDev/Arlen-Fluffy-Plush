import {
  Component,
  inject,
  ChangeDetectionStrategy,
  Injector,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService, type Language } from '../../services/i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="language-switcher">
      <button
        type="button"
        class="lang-btn"
        [class.active]="i18n.getLanguage() === 'en'"
        (click)="switchLanguage('en')"
      >
        EN
      </button>
      <span class="separator">|</span>
      <button
        type="button"
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
  private readonly injector = inject(Injector);

  switchLanguage(lang: Language) {
    if (typeof window === 'undefined') {
      this.i18n.setLanguage(lang);
      return;
    }
    // Translated strings differ in length between languages; preserve the
    // scroll position so the page doesn't jump when content reflows.
    const scrollY = window.scrollY;
    this.i18n.setLanguage(lang);
    afterNextRender(() => window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' }), {
      injector: this.injector,
    });
  }
}
