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
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  KittensService,
  type KittenApiItem,
} from '../../pages/kittens/kittens.service';
import { I18nService } from '../../services/i18n.service';
import { mapKittenToListItem, type KittenListItem } from '../../services/kitten-view.util';
import { FamiliesService, type FamilyApiItem } from '../../services/families.service';
import { buildFamilyOrder } from '../../services/family-order.util';
import { LocalizedPathPipe } from '../../pipes/localized-path.pipe';
import { StatusPillComponent, statusLabelKey } from '../status-pill/status-pill.component';
import { CardGalleryComponent } from '../card-gallery/card-gallery.component';

/** How many kittens the home page teaser shows. */
const CAROUSEL_SIZE = 10;

/**
 * One page big enough to hold the whole catalogue, asked for the same way
 * `/kittens` asks for it.
 *
 * The teaser is the head of the catalogue rather than a listing of its own, so
 * it cannot just take the first ten records the API hands back: the catalogue
 * re-orders them by litter, and ten kittens off the top of the raw listing are
 * a different ten from the ten a visitor sees after following "all kittens".
 * So the whole list is read and cut after it has been put in order.
 */
const LOOKUP_PER_PAGE = 1000;

/** Fraction of the visible width one arrow click scrolls. */
const SCROLL_STEP_RATIO = 0.9;

@Component({
  selector: 'app-kitten-carousel',
  imports: [
    RouterLink,
    LocalizedPathPipe,
    StatusPillComponent,
    CardGalleryComponent,
  ],
  templateUrl: './kitten-carousel.component.html',
  styleUrl: './kitten-carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'updateScrollState()',
  },
})
export class KittenCarouselComponent {
  private readonly kittensService = inject(KittensService);
  private readonly familiesService = inject(FamiliesService);
  protected readonly i18n = inject(I18nService);

  private readonly track = viewChild<ElementRef<HTMLElement>>('track');

  private readonly rawKittens = signal<readonly KittenApiItem[]>([]);
  private readonly families = signal<readonly FamilyApiItem[]>([]);

  /**
   * The first ten kittens of the catalogue, in the catalogue's own order: by
   * the litter's `displayOrder`, then by the kitten's place inside that litter.
   * Mapped in a `computed` rather than on arrival, so the cards re-read the
   * dictionary when the visitor switches language.
   */
  protected readonly kittens = computed<KittenListItem[]>(() => {
    const mapped = this.rawKittens().map((kitten) => mapKittenToListItem(kitten, this.i18n));
    const order = buildFamilyOrder(this.families(), mapped);

    return mapped.sort((a, b) => order.compareKittens(a, b)).slice(0, CAROUSEL_SIZE);
  });
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);

  protected readonly canScrollPrev = signal(false);
  protected readonly canScrollNext = signal(false);

  constructor() {
    forkJoin({
      kittens: this.kittensService.getKittens({ perPage: LOOKUP_PER_PAGE }),
      // The litters only decide the order here, so a listing the backend
      // cannot serve costs the order and not the strip: the teaser falls back
      // to the order the kittens arrived in rather than disappearing.
      families: this.familiesService
        .getAllFamilies()
        .pipe(catchError(() => of<FamilyApiItem[]>([]))),
    }).subscribe({
      next: ({ kittens, families }) => {
        this.rawKittens.set(kittens.data ?? []);
        this.families.set(families);
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

  /**
   * The short label the card is announced by.
   *
   * It has to name the state as well, because an `aria-label` on the link
   * replaces everything inside it: without this the status pill would be
   * visible to everyone but the people reading the page with a screen reader.
   * A state the site does not label — a kitten nobody has set a status for —
   * simply adds nothing.
   */
  protected cardLabel(kitten: KittenListItem): string {
    const key = statusLabelKey(kitten.status);

    return [kitten.name, kitten.breed, key ? this.i18n.t(key) : null]
      .filter((part): part is string => Boolean(part))
      .join(', ');
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
