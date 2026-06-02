import {
  AfterViewInit,
  Directive,
  ElementRef,
<<<<<<< HEAD
=======
  Input,
>>>>>>> f9e94954a118afdbd9fb2809f0de949b9977dae5
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
<<<<<<< HEAD
  input,
=======
>>>>>>> f9e94954a118afdbd9fb2809f0de949b9977dae5
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import PhotoSwipeLightbox from 'photoswipe/lightbox';

@Directive({
  selector: '[appPhotoViewer]',
<<<<<<< HEAD
  exportAs: 'appPhotoViewer',
})
export class PhotoViewerDirective implements OnInit, AfterViewInit, OnDestroy {
  readonly appPhotoViewer = input<string>('a');
=======
})
export class PhotoViewerDirective implements OnInit, AfterViewInit, OnDestroy {
  @Input() appPhotoViewer: string = 'a';
>>>>>>> f9e94954a118afdbd9fb2809f0de949b9977dae5

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
<<<<<<< HEAD
      children: this.appPhotoViewer(),
=======
      children: this.appPhotoViewer,
>>>>>>> f9e94954a118afdbd9fb2809f0de949b9977dae5
      pswpModule: () => import('photoswipe'),
      bgOpacity: 0.92,
      showHideAnimationType: 'fade',
      padding: { top: 24, bottom: 24, left: 16, right: 16 },
    });

<<<<<<< HEAD
=======
    // When PhotoSwipe asks for item data, swap in real dimensions if we've probed them.
>>>>>>> f9e94954a118afdbd9fb2809f0de949b9977dae5
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

<<<<<<< HEAD
    this.probeAll();

=======
    // Initial probe of whatever's already in the DOM.
    this.probeAll();

    // Re-probe when @for adds/removes anchors or `selectedImage` changes the main image's href.
>>>>>>> f9e94954a118afdbd9fb2809f0de949b9977dae5
    this.mutationObserver = new MutationObserver(() => this.probeAll());
    this.mutationObserver.observe(this.host.nativeElement, {
      subtree: true,
      childList: true,
<<<<<<< HEAD
=======
      attributes: true,
      attributeFilter: ['href'],
>>>>>>> f9e94954a118afdbd9fb2809f0de949b9977dae5
    });
  }

  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.lightbox?.destroy();
    this.lightbox = null;
  }

<<<<<<< HEAD
  open(index: number): void {
    if (!isPlatformBrowser(this.platformId) || !this.lightbox) return;
    this.lightbox.loadAndOpen(index);
  }

  private probeAll(): void {
    const anchors = this.host.nativeElement.querySelectorAll<HTMLAnchorElement>(this.appPhotoViewer());
=======
  private probeAll(): void {
    const anchors = this.host.nativeElement.querySelectorAll<HTMLAnchorElement>(this.appPhotoViewer);
>>>>>>> f9e94954a118afdbd9fb2809f0de949b9977dae5
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

<<<<<<< HEAD
=======
    // Avoid Angular's zone churn for image probes — these are background loads.
>>>>>>> f9e94954a118afdbd9fb2809f0de949b9977dae5
    this.zone.runOutsideAngular(() => {
      const probe = new Image();
      probe.onload = () => {
        const w = probe.naturalWidth;
        const h = probe.naturalHeight;
        if (!w || !h) return;
        this.dimensions.set(url, { w, h });
<<<<<<< HEAD
        this.host.nativeElement
          .querySelectorAll<HTMLAnchorElement>(this.appPhotoViewer())
=======
        // Apply to every anchor that points to this URL (main image + thumb may share a href).
        this.host.nativeElement
          .querySelectorAll<HTMLAnchorElement>(this.appPhotoViewer)
>>>>>>> f9e94954a118afdbd9fb2809f0de949b9977dae5
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
