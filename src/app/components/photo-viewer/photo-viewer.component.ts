import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { I18nService } from '../../services/i18n.service';

export interface PhotoViewerImage {
  full: string;
  thumbnail?: string;
  mobile?: string;
}

const SWIPE_THRESHOLD = 40;

@Component({
  selector: 'app-photo-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
  template: `
    @if (isOpen()) {
      <div
        class="pv-overlay"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="label()"
        (click)="onBackdropClick($event)"
        (keydown)="onDialogKeydown($event)"
        #dialog
      >
        <div class="pv-topbar">
          @if (hasMultiple()) {
            <span class="pv-counter" aria-live="polite">{{ counterText() }}</span>
          }
          <button
            #closeBtn
            type="button"
            class="pv-btn pv-btn--close"
            [attr.aria-label]="i18n.t('viewerClose')"
            (click)="close()"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <figure class="pv-stage" (touchstart)="onTouchStart($event)" (touchend)="onTouchEnd($event)">
          @if (hasMultiple()) {
            <button
              type="button"
              class="pv-btn pv-btn--nav pv-btn--prev"
              [attr.aria-label]="i18n.t('viewerPrev')"
              (click)="prev()"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          }

          @if (isLoading()) {
            <span class="pv-spinner" aria-hidden="true"></span>
          }

          <img
            class="pv-image"
            [src]="current()?.full"
            [alt]="imageAlt()"
            (load)="onImageLoad()"
            (error)="onImageLoad()"
          />

          @if (hasMultiple()) {
            <button
              type="button"
              class="pv-btn pv-btn--nav pv-btn--next"
              [attr.aria-label]="i18n.t('viewerNext')"
              (click)="next()"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          }
        </figure>

        @if (hasMultiple()) {
          <div class="pv-thumbs" role="list" [attr.aria-label]="label()">
            @for (img of images(); track img.full; let i = $index) {
              <button
                type="button"
                role="listitem"
                class="pv-thumb"
                [class.pv-thumb--active]="i === currentIndex()"
                [attr.aria-current]="i === currentIndex() ? 'true' : null"
                [attr.aria-label]="goToLabel(i)"
                (click)="goTo(i)"
              >
                <img [src]="img.thumbnail || img.mobile || img.full" alt="" loading="lazy" />
              </button>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      .pv-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: clamp(0.5rem, 2vw, 1rem);
        padding: clamp(0.75rem, 3vw, 2rem);
        background: rgb(0 0 0 / 82%);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        animation: pv-fade 0.22s ease;
      }

      @keyframes pv-fade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .pv-topbar {
        flex-shrink: 0;
        width: 100%;
        max-width: 1280px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      .pv-counter {
        padding: 0.35rem 0.85rem;
        border-radius: 999px;
        background: rgb(255 255 255 / 14%);
        color: #fff;
        font-size: 0.85rem;
        font-weight: 600;
        letter-spacing: 0.02em;
      }

      .pv-topbar .pv-btn--close {
        margin-left: auto;
      }

      .pv-stage {
        position: relative;
        flex: 1;
        min-height: 0;
        width: 100%;
        max-width: 1280px;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .pv-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgb(0 0 0 / 45%);
        animation: pv-pop 0.25s ease;
      }

      @keyframes pv-pop {
        from {
          opacity: 0;
          transform: scale(0.97);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .pv-btn {
        display: inline-grid;
        place-items: center;
        width: 44px;
        height: 44px;
        flex-shrink: 0;
        border: 0;
        border-radius: 999px;
        background: rgb(255 255 255 / 14%);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        color: #fff;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.2s ease;
      }

      .pv-btn:hover {
        background: rgb(255 255 255 / 26%);
        transform: scale(1.06);
      }

      .pv-btn:focus-visible {
        outline: 3px solid #fff;
        outline-offset: 2px;
      }

      .pv-btn--nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 48px;
        height: 48px;
      }

      .pv-btn--nav:hover {
        transform: translateY(-50%) scale(1.06);
      }

      .pv-btn--prev {
        left: 0.25rem;
      }

      .pv-btn--next {
        right: 0.25rem;
      }

      .pv-spinner {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 42px;
        height: 42px;
        margin: -21px 0 0 -21px;
        border-radius: 50%;
        border: 3px solid rgb(255 255 255 / 25%);
        border-top-color: #fff;
        animation: pv-spin 0.8s linear infinite;
      }

      @keyframes pv-spin {
        to {
          transform: rotate(360deg);
        }
      }

      .pv-thumbs {
        flex-shrink: 0;
        display: flex;
        gap: 0.5rem;
        max-width: 100%;
        padding: 0.25rem;
        overflow-x: auto;
        scrollbar-width: thin;
        scrollbar-color: rgb(255 255 255 / 35%) transparent;
      }

      .pv-thumbs::-webkit-scrollbar {
        height: 6px;
      }

      .pv-thumbs::-webkit-scrollbar-thumb {
        background: rgb(255 255 255 / 35%);
        border-radius: 999px;
      }

      .pv-thumb {
        flex-shrink: 0;
        width: 64px;
        height: 64px;
        padding: 0;
        border: 2px solid transparent;
        border-radius: 12px;
        overflow: hidden;
        background: rgb(255 255 255 / 10%);
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
      }

      .pv-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .pv-thumb:hover {
        opacity: 1;
        transform: translateY(-2px);
      }

      .pv-thumb--active {
        opacity: 1;
        border-color: #fff;
      }

      .pv-thumb:focus-visible {
        outline: 3px solid #fff;
        outline-offset: 2px;
      }

      @media (prefers-reduced-motion: reduce) {
        .pv-overlay,
        .pv-image {
          animation: none;
        }
      }
    `,
  ],
})
export class PhotoViewerComponent implements OnDestroy {
  readonly images = input<PhotoViewerImage[]>([]);
  readonly label = input<string>('');

  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  protected readonly i18n = inject(I18nService);

  private readonly dialogRef = viewChild<ElementRef<HTMLElement>>('dialog');
  private readonly closeBtnRef = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');

  protected readonly isOpen = signal(false);
  protected readonly currentIndex = signal(0);
  protected readonly isLoading = signal(false);

  private triggerEl: HTMLElement | null = null;
  private prevBodyOverflow = '';
  private touchStartX = 0;

  protected readonly count = computed(() => this.images().length);
  protected readonly hasMultiple = computed(() => this.count() > 1);
  protected readonly current = computed<PhotoViewerImage | null>(
    () => this.images()[this.currentIndex()] ?? null,
  );

  protected readonly counterText = computed(() =>
    this.i18n
      .t('viewerCounter')
      .replace('{current}', String(this.currentIndex() + 1))
      .replace('{total}', String(this.count())),
  );

  protected readonly imageAlt = computed(() =>
    this.i18n
      .t('viewerImageAlt')
      .replace('{label}', this.label())
      .replace('{index}', String(this.currentIndex() + 1)),
  );

  ngOnDestroy(): void {
    if (this.isOpen()) {
      this.restoreBodyScroll();
    }
  }

  open(index: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const total = this.count();
    if (total === 0) return;

    this.triggerEl = this.document.activeElement as HTMLElement | null;
    this.currentIndex.set(Math.min(Math.max(index, 0), total - 1));
    this.isLoading.set(true);
    this.isOpen.set(true);

    this.prevBodyOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';

    queueMicrotask(() => this.closeBtnRef()?.nativeElement.focus());
    this.preloadNeighbors();
  }

  close(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isOpen.set(false);
    this.restoreBodyScroll();
    const trigger = this.triggerEl;
    this.triggerEl = null;
    queueMicrotask(() => trigger?.focus());
  }

  next(): void {
    if (!this.hasMultiple()) return;
    this.goTo((this.currentIndex() + 1) % this.count());
  }

  prev(): void {
    if (!this.hasMultiple()) return;
    this.goTo((this.currentIndex() - 1 + this.count()) % this.count());
  }

  goTo(index: number): void {
    this.currentIndex.set(index);
    this.isLoading.set(true);
    this.preloadNeighbors();
  }

  goToLabel(index: number): string {
    return this.i18n.t('viewerGoToImage').replace('{index}', String(index + 1));
  }

  protected onImageLoad(): void {
    this.isLoading.set(false);
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.isOpen()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prev();
    }
  }

  protected onDialogKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const dialog = this.dialogRef()?.nativeElement;
    if (!dialog) return;
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>('button:not([disabled])'),
    ).filter((el) => el.offsetParent !== null);
    if (focusable.length === 0) return;

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

  protected onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0]?.clientX ?? 0;
  }

  protected onTouchEnd(event: TouchEvent): void {
    const endX = event.changedTouches[0]?.clientX ?? 0;
    const delta = endX - this.touchStartX;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta < 0) {
      this.next();
    } else {
      this.prev();
    }
  }

  private restoreBodyScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.document.body.style.overflow = this.prevBodyOverflow;
  }

  private preloadNeighbors(): void {
    if (!isPlatformBrowser(this.platformId) || !this.hasMultiple()) return;
    const total = this.count();
    const list = this.images();
    const nextIdx = (this.currentIndex() + 1) % total;
    const prevIdx = (this.currentIndex() - 1 + total) % total;
    for (const idx of [nextIdx, prevIdx]) {
      const url = list[idx]?.full;
      if (url) {
        const img = new Image();
        img.src = url;
      }
    }
  }
}
