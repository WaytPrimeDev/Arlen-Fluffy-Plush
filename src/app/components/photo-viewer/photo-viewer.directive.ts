import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import { I18nService } from '../../services/i18n.service';

/** The fields of PhotoSwipe's slide data this directive fills in. */
interface PhotoItemData {
  src?: string;
  msrc?: string;
  alt?: string;
  w?: number;
  h?: number;
  width?: number;
  height?: number;
  [key: string]: unknown;
}

@Directive({
  selector: '[appPhotoViewer]',
})
export class PhotoViewerDirective implements OnInit, AfterViewInit, OnDestroy {
  /** Selector of the anchors the viewer collects, relative to the host. */
  readonly appPhotoViewer = input('a');

  /**
   * Width caps of the two derivatives of each photo: the one rendered on the
   * page and the larger one the lightbox opens.
   *
   * PhotoSwipe has to be told a slide's proportions before it opens, and it
   * stretches the photo to whatever it was told, so a guess is not harmless —
   * a wrong ratio is a visibly squashed photo until something corrects it.
   * The photo already on the page settles that question: it is a `c_limit`
   * derivative of the same original, so it shares the original's aspect ratio
   * exactly, and being small it arrives early. Reading it costs no request,
   * which is why nothing is probed over the network any more.
   */
  readonly pageImageWidth = input(0, { transform: numberAttribute });
  readonly viewerImageWidth = input(0, { transform: numberAttribute });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly i18n = inject(I18nService);
  private lightbox: PhotoSwipeLightbox | null = null;
  private mutationObserver: MutationObserver | null = null;
  /** Images already waited on, so each one gets a single listener. */
  private readonly awaited = new WeakSet<HTMLImageElement>();

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.lightbox = new PhotoSwipeLightbox({
      gallery: this.host.nativeElement,
      children: this.appPhotoViewer(),
      pswpModule: () => import('photoswipe'),
      bgOpacity: 0.92,
      showHideAnimationType: 'fade',
      padding: { top: 24, bottom: 24, left: 16, right: 16 },

      // PhotoSwipe ships English labels for its own controls, and they are
      // all a screen reader has to go on, so they are handed over translated.
      // The language is read once here rather than watched: switching it
      // changes the URL prefix, which is a navigation that rebuilds the page
      // this directive lives on.
      closeTitle: this.i18n.t('viewerClose'),
      arrowPrevTitle: this.i18n.t('viewerPrev'),
      arrowNextTitle: this.i18n.t('viewerNext'),
      zoomTitle: this.i18n.t('viewerZoom'),
      errorMsg: this.i18n.t('viewerError'),
      indexIndicatorSep: counterSeparator(this.i18n.t('viewerCounter')),
    });

    // PhotoSwipe reads a slide's source and size from an anchor, and these
    // slides are buttons, so everything it needs is handed to it here.
    this.lightbox.addFilter(
      'domItemData',
      (itemData: PhotoItemData, element: HTMLElement) => {
        const source = element.dataset['pswpSrc'];
        if (source) {
          itemData.src = source;
        }

        const image = element.querySelector('img');
        if (image) {
          itemData.msrc = image.currentSrc || image.src;
          itemData.alt = image.getAttribute('alt') ?? '';
        }

        const size = this.sizeOf(element, image);
        itemData.w = itemData.width = size.width;
        itemData.h = itemData.height = size.height;

        return itemData;
      },
    );

    this.lightbox.init();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.measureAll();

    // `@for` adds and removes anchors, and switching photos rewrites `src`.
    this.mutationObserver = new MutationObserver(() => this.measureAll());
    this.mutationObserver.observe(this.host.nativeElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['src', 'data-pswp-src'],
    });
  }

  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.lightbox?.destroy();
    this.lightbox = null;
  }

  /**
   * Dimensions in the order they become trustworthy: what was measured from
   * the rendered photo, the photo itself, and finally the slide's own box —
   * only reachable before the photo has painted, when there is nothing on
   * screen to click.
   */
  private sizeOf(
    element: HTMLElement,
    image: HTMLImageElement | null,
  ): { width: number; height: number } {
    const measuredWidth = Number(element.dataset['pswpWidth']);
    const measuredHeight = Number(element.dataset['pswpHeight']);
    if (measuredWidth && measuredHeight) {
      return { width: measuredWidth, height: measuredHeight };
    }

    if (image?.naturalWidth && image.naturalHeight) {
      return { width: image.naturalWidth, height: image.naturalHeight };
    }

    const box = element.getBoundingClientRect();
    return { width: Math.round(box.width), height: Math.round(box.height) };
  }

  private measureAll(): void {
    this.host.nativeElement
      .querySelectorAll<HTMLElement>(this.appPhotoViewer())
      .forEach((slide) => this.measure(slide));
  }

  private measure(slide: HTMLElement): void {
    const image = slide.querySelector('img');
    if (!image) return;

    if (image.complete && image.naturalWidth) {
      this.applyDimensions(slide, image);
      return;
    }

    if (this.awaited.has(image)) return;
    this.awaited.add(image);
    image.addEventListener('load', () => this.applyDimensions(slide, image), { once: true });
  }

  private applyDimensions(slide: HTMLElement, image: HTMLImageElement): void {
    const page = this.pageImageWidth();
    const viewer = this.viewerImageWidth();

    // A page image narrower than its own cap means the original was smaller
    // still, so the viewer's URL returns that same original and the sizes
    // match; at the cap the viewer's copy is the larger one.
    const scaled = page > 0 && viewer > 0 && image.naturalWidth >= page;
    const factor = scaled ? viewer / page : 1;
    const width = String(Math.round(image.naturalWidth * factor));
    const height = String(Math.round(image.naturalHeight * factor));

    if (slide.dataset['pswpWidth'] === width && slide.dataset['pswpHeight'] === height) {
      return;
    }

    slide.dataset['pswpWidth'] = width;
    slide.dataset['pswpHeight'] = height;
  }
}

/**
 * The counter's separator, taken from the `{current} / {total}` phrase so the
 * two languages can punctuate it differently. PhotoSwipe builds the counter
 * itself and only lets the middle be replaced, hence the phrase is split
 * rather than used whole.
 */
function counterSeparator(phrase: string): string {
  const [, separator] = /\{current\}(.*)\{total\}/.exec(phrase) ?? [];
  return separator || ' / ';
}
