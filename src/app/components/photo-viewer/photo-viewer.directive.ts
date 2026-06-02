import {
  AfterViewInit,
  Directive,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import PhotoSwipeLightbox from 'photoswipe/lightbox';

@Directive({
  selector: '[appPhotoViewer]',
  exportAs: 'appPhotoViewer',
})
export class PhotoViewerDirective implements OnInit, AfterViewInit, OnDestroy {
  readonly appPhotoViewer = input<string>('a');

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
      children: this.appPhotoViewer(),
      pswpModule: () => import('photoswipe'),
      bgOpacity: 0.92,
      showHideAnimationType: 'fade',
      padding: { top: 24, bottom: 24, left: 16, right: 16 },
    });

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

    this.probeAll();

    this.mutationObserver = new MutationObserver(() => this.probeAll());
    this.mutationObserver.observe(this.host.nativeElement, {
      subtree: true,
      childList: true,
    });
  }

  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.lightbox?.destroy();
    this.lightbox = null;
  }

  open(index: number): void {
    if (!isPlatformBrowser(this.platformId) || !this.lightbox) return;
    this.lightbox.loadAndOpen(index);
  }

  private probeAll(): void {
    const anchors = this.host.nativeElement.querySelectorAll<HTMLAnchorElement>(this.appPhotoViewer());
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

    this.zone.runOutsideAngular(() => {
      const probe = new Image();
      probe.onload = () => {
        const w = probe.naturalWidth;
        const h = probe.naturalHeight;
        if (!w || !h) return;
        this.dimensions.set(url, { w, h });
        this.host.nativeElement
          .querySelectorAll<HTMLAnchorElement>(this.appPhotoViewer())
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
