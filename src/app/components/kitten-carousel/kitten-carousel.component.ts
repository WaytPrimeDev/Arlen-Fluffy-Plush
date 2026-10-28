import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  KittensService,
  type KittenApiItem,
} from '../../pages/kittens/kittens.service';
import { I18nService } from '../../services/i18n.service';
import { mapKittenToListItem, type KittenListItem } from '../../services/kitten-view.util';
import { LocalizedPathPipe } from '../../pipes/localized-path.pipe';
import { ImageFallbackDirective } from '../image-fallback/image-fallback.directive';

/** How many kittens the home page teaser shows. */
const CAROUSEL_SIZE = 10;

/** Fraction of the visible width one arrow click scrolls. */
const SCROLL_STEP_RATIO = 0.9;

@Component({
  selector: 'app-kitten-carousel',
  imports: [RouterLink, LocalizedPathPipe, ImageFallbackDirective],
  templateUrl: './kitten-carousel.component.html',
  styleUrl: './kitten-carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'updateScrollState()',
  },
})
export class KittenCarouselComponent {
  private readonly kittensService = inject(KittensService);
  protected readonly i18n = inject(I18nService);

  private readonly track = viewChild<ElementRef<HTMLElement>>('track');

  private readonly rawKittens = signal<readonly KittenApiItem[]>([]);

  protected readonly kittens = computed<KittenListItem[]>(() =>
    this.rawKittens().map((kitten) => mapKittenToListItem(kitten, this.i18n)),
  );
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);

  protected readonly canScrollPrev = signal(false);
  protected readonly canScrollNext = signal(false);

  constructor() {
    this.kittensService.getKittens({ perPage: CAROUSEL_SIZE }).subscribe({
      next: (response) => {
        this.rawKittens.set((response.data ?? []).slice(0, CAROUSEL_SIZE));
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });

    // The arrows depend on measured layout, so they are resolved after render
    // and re-resolved whenever the rendered list changes.
    afterRenderEffect(() => {
      this.kittens();
      this.updateScrollState();
    });
  }

  protected scrollPrev(): void {
    this.scrollByStep(-1);
  }

  protected scrollNext(): void {
    this.scrollByStep(1);
  }

  protected updateScrollState(): void {
    const element = this.track()?.nativeElement;
    if (!element) {
      this.canScrollPrev.set(false);
      this.canScrollNext.set(false);
      return;
    }

    // Sub-pixel scroll offsets make exact comparisons unreliable.
    const maxScroll = element.scrollWidth - element.clientWidth;
    this.canScrollPrev.set(element.scrollLeft > 1);
    this.canScrollNext.set(element.scrollLeft < maxScroll - 1);
  }

  private scrollByStep(direction: -1 | 1): void {
    const element = this.track()?.nativeElement;
    if (!element) return;

    element.scrollBy({
      left: direction * Math.round(element.clientWidth * SCROLL_STEP_RATIO),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
