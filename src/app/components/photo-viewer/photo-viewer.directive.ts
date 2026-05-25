import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import PhotoSwipeLightbox from 'photoswipe/lightbox';

@Directive({
  selector: '[appPhotoViewer]',
})
export class PhotoViewerDirective implements OnInit, AfterViewInit, OnDestroy {
  @Input() appPhotoViewer: string = 'a';

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);
  private lightbox: PhotoSwipeLightbox | null = null;
  private mutationObserver: MutationObserver | null = null;
  private readonly dimensions = new Map<string, { w: number; h: number }>();

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.lightbox = new PhotoSwipeLightbox({
      gallery: this.host.nativeElement,
      children: this.appPhotoViewer,
      pswpModule: () => import('photoswipe'),
      bgOpacity: 0.92,
      showHideAnimationType: 'fade',
      padding: { top: 24, bottom: 24, left: 16, right: 16 },
    });

    // When PhotoSwipe asks for item data, swap in real dimensions if we've probed them.
    this.lightbox.addFilter(
      'domItemData',
      (itemData: { w?: number; h?: number; [k: string]: unknown }, _element: HTMLElement, linkEl: HTMLAnchorElement | null) => {
        const url = linkEl?.getAttribute('href') ?? '';
        const dim = url ? this.dimensions.get(url) : undefined;
        if (dim) {
          itemData.w = dim.w;
          itemData.h = dim.h;
        }
        return itemData;
      },
    );

    this.lightbox.init();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Initial probe of whatever's already in the DOM.
    this.probeAll();

    // Re-probe when @for adds/removes anchors or `selectedImage` changes the main image's href.
    this.mutationObserver = new MutationObserver(() => this.probeAll());
    this.mutationObserver.observe(this.host.nativeElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['href'],
    });
  }

  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.lightbox?.destroy();
    this.lightbox = null;
  }

  private probeAll(): void {
    const anchors = this.host.nativeElement.querySelectorAll<HTMLAnchorElement>(this.appPhotoViewer);
    anchors.forEach((a) => this.probeAnchor(a));
  }

  private probeAnchor(a: HTMLAnchorElement): void {
    const url = a.getAttribute('href');
    if (!url) return;

    const cached = this.dimensions.get(url);
    if (cached) {
      this.applyDimensions(a, cached.w, cached.h);
      return;
    }

    // Avoid Angular's zone churn for image probes — these are background loads.
    this.zone.runOutsideAngular(() => {
      const probe = new Image();
      probe.onload = () => {
        const w = probe.naturalWidth;
        const h = probe.naturalHeight;
        if (!w || !h) return;
        this.dimensions.set(url, { w, h });
        // Apply to every anchor that points to this URL (main image + thumb may share a href).
        this.host.nativeElement
          .querySelectorAll<HTMLAnchorElement>(this.appPhotoViewer)
          .forEach((el) => {
            if (el.getAttribute('href') === url) this.applyDimensions(el, w, h);
          });
      };
      probe.src = url;
    });
  }

  private applyDimensions(a: HTMLAnchorElement, w: number, h: number): void {
    if (a.getAttribute('data-pswp-width') === String(w) && a.getAttribute('data-pswp-height') === String(h)) {
      return;
    }
    a.setAttribute('data-pswp-width', String(w));
    a.setAttribute('data-pswp-height', String(h));
  }
}
