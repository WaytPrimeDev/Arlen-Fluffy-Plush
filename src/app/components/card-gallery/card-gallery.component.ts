import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { KITTEN_PLACEHOLDER } from '../../services/kitten-view.util';
import { ImageFallbackDirective } from '../image-fallback/image-fallback.directive';

/**
 * The little photo gallery inside a card.
 *
 * One scroll container holding the card's first few photos, so the two input
 * methods are served by the same thing rather than by two code paths: a touch
 * visitor swipes the container, which is what the platform already does for a
 * scroller with snap points, and a mouse visitor clicks the arrows, which
 * scroll it by exactly one slide. Nothing is driven by a drag handler, so the
 * gesture keeps the inertia and the rubber-banding of the device it runs on.
 * With `swipe` off the container is simply not scrollable by hand — the arrows
 * still move it, because `scrollTo` works on an overflow-hidden box.
 *
 * The slides are links rather than bare images so a click on the photo still
 * opens the animal's page. They are hidden from assistive technology and kept
 * out of the tab order: the card's own heading link points at the same page
 * and carries the name, and the arrows and dots are the labelled controls.
 */
@Component({
  selector: 'app-card-gallery',
  imports: [RouterLink, ImageFallbackDirective],
  templateUrl: './card-gallery.component.html',
  styleUrl: './card-gallery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardGalleryComponent {
  protected readonly i18n = inject(I18nService);

  /** The photos to show, in display order. Expected to hold at least one. */
  readonly images = input.required<readonly string[]>();
  /** Describes the animal; used as the photos' alt text. */
  readonly alt = input('');
  /** Where a click on a photo goes, as a `routerLink` value. */
  readonly link = input<readonly unknown[] | null>(null);
  /** The stand-in for a photo whose URL turns out to be dead. */
  readonly placeholder = input(KITTEN_PLACEHOLDER);
  readonly loading = input<'lazy' | 'eager'>('lazy');
  /**
   * Whether a touch visitor flips the photos by swiping them.
   *
   * Turned off inside something that scrolls horizontally itself, such as the
   * home page's strip of cards: two nested scrollers on the same axis mean a
   * swipe on a photo never reaches the strip, so there the photos are flipped
   * with the arrows and the dots — which a touch visitor is shown as well —
   * and the swipe stays with the strip it belongs to.
   */
  readonly swipe = input(true);

  private readonly track = viewChild<ElementRef<HTMLElement>>('track');

  /** Which slide is in view, kept in step with the container's scroll. */
  protected readonly index = signal(0);

  protected readonly hasMany = computed(() => this.images().length > 1);
  protected readonly canPrev = computed(() => this.index() > 0);
  protected readonly canNext = computed(() => this.index() < this.images().length - 1);

  protected prev(event: Event): void {
    this.stop(event);
    this.scrollTo(this.index() - 1);
  }

  protected next(event: Event): void {
    this.stop(event);
    this.scrollTo(this.index() + 1);
  }

  protected goTo(event: Event, index: number): void {
    this.stop(event);
    this.scrollTo(index);
  }

  /**
   * Reads the slide in view back off the container, so the dots and the arrows
   * agree with it however it was moved — an arrow, a dot, a swipe, or a
   * trackpad's horizontal scroll.
   */
  protected onScroll(): void {
    const element = this.track()?.nativeElement;
    if (!element || element.clientWidth === 0) return;

    const index = Math.round(element.scrollLeft / element.clientWidth);
    this.index.set(Math.min(Math.max(index, 0), this.images().length - 1));
  }

  private scrollTo(index: number): void {
    const element = this.track()?.nativeElement;
    if (!element) return;

    const target = Math.min(Math.max(index, 0), this.images().length - 1);
    element.scrollTo({
      left: target * element.clientWidth,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
    // Set straight away as well: a smooth scroll reports its new offset only
    // once it has run, and the arrows should not look stale until then.
    this.index.set(target);
  }

  /**
   * A control sits inside a card that is clickable as a whole, so flipping a
   * photo must not also count as a click on the card.
   */
  private stop(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
