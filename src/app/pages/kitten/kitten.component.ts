import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap, forkJoin } from 'rxjs';
import { KittensService, type KittenApiItem } from '../kittens/kittens.service';
import { ParentsService, type ParentApiItem } from '../parents/parents.service';
import { I18nService } from '../../services/i18n.service';
import {
  formatAgeShort,
  mapStatus,
  withCurrency,
  KITTEN_PLACEHOLDER,
  PARENT_PLACEHOLDER,
} from '../../services/kitten-view.util';
import { taxonomyName } from '../../services/taxonomy';
import { PhotoViewerDirective } from '../../components/photo-viewer/photo-viewer.directive';
import { SeoService } from '../../services/seo.service';
import { AnalyticsService } from '../../services/analytics.service';
import { LocalizedPathPipe } from '../../pipes/localized-path.pipe';
import { ImageFallbackDirective } from '../../components/image-fallback/image-fallback.directive';
import { HttpErrorResponse } from '@angular/common/http';
import { STAGE_WIDTH, VIEWER_WIDTH, scaledImage } from '../../services/image-url.util';
import { kittenVideo } from '../../services/video-url.util';
import { catRouteParam } from '../../services/cat-route.util';

interface PhotoSlide {
  kind: 'photo';
  /** Stable `@for` key; a photo is identified by the URL it opens. */
  key: string;
  /**
   * 1-based position in the lightbox, which is not the position on the stage:
   * the placeholder occupies a stage slot but is never opened, so the two
   * numberings diverge for a kitten with no photos. Announcing the stage index
   * there would promise a slide the viewer does not contain.
   */
  viewerIndex: number;
  /** Shown on the page, at the photo's own aspect ratio. */
  display: string;
  /** Opened by the lightbox — the same photo, larger. */
  zoom: string;
  /** Square crop, which is what the thumbnail strip wants. */
  thumb: string;
}

interface VideoSlide {
  kind: 'video';
  key: string;
  viewerIndex: number;
  /** Poster frame, standing in for the video until it is opened. */
  display: string;
  thumb: string;
  /** Player URL, handed to the lightbox and loaded only once activated. */
  embed: string;
  /** The video's own page, for visitors who would rather watch it there. */
  watch: string;
  id: string;
}

/**
 * The stand-in for a kitten with no photos at all. It is a slide so the stage
 * has something to render, but it carries no `zoom`: there is nothing to open
 * full screen, and putting a placeholder in the lightbox would be a dead end.
 */
interface PlaceholderSlide {
  kind: 'placeholder';
  key: string;
  display: string;
}

type GallerySlide = PhotoSlide | VideoSlide | PlaceholderSlide;

/**
 * Proportions the lightbox sizes the video slide to. PhotoSwipe needs a slide's
 * dimensions up front and cannot measure an iframe, so the player is declared
 * at the 16:9 every YouTube embed renders at; the numbers are a ratio rather
 * than a size, since the slide is then fitted to the viewport.
 */
const VIDEO_SLIDE_WIDTH = 1280;
const VIDEO_SLIDE_HEIGHT = 720;

interface LoadState {
  kitten: KittenApiItem | null;
  mother: ParentApiItem | null;
  father: ParentApiItem | null;
  error: string;
  /** Set for a 404 only; see the note above `loadState`. */
  notFound: boolean;
  loaded: boolean;
}

@Component({
  selector: 'app-kitten',
  imports: [RouterLink, PhotoViewerDirective, LocalizedPathPipe, ImageFallbackDirective],
  templateUrl: './kitten.component.html',
  styleUrl: './kitten.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KittenComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly kittensService = inject(KittensService);
  private readonly parentsService = inject(ParentsService);
  protected readonly i18n = inject(I18nService);

  /** Stand-in for a grown cat whose photo is missing, read by the template. */
  protected readonly parentPlaceholder = PARENT_PLACEHOLDER;
  private readonly seo = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);

  /** Handed to the photo viewer so it can size slides from the page's own image. */
  protected readonly stageWidth = STAGE_WIDTH;
  protected readonly viewerWidth = VIEWER_WIDTH;

  private readonly requestedImageIndex = signal(0);

  /** The slug or id in the URL, kept so a 404 can name the page it was. */
  private readonly routeParam = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );

  /**
 * A record the API will not serve is not the same failure as an API that is
 * down, and the two must not share a message. Only litters are published now:
 * taking a kitten off its litter hides it, and the endpoint then answers 404
 * for an address that used to work. That is an ordinary dead link — it gets
 * the "no longer listed" copy and `noindex`, so a crawler drops the URL
 * instead of keeping it and reporting a soft 404. Everything else is a real
 * error and still says so.
 */
  private readonly loadState = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id') ?? ''),
      switchMap((id) =>
        this.kittensService.getKitten(id).pipe(
          switchMap((kitten) => {
            const momId = kitten.parentId?.mom ?? null;
            const dadId = kitten.parentId?.dad ?? null;
            return forkJoin({
              mother: momId
                ? this.parentsService.getParent(momId).pipe(catchError(() => of(null)))
                : of(null),
              father: dadId
                ? this.parentsService.getParent(dadId).pipe(catchError(() => of(null)))
                : of(null),
            }).pipe(
              map(
                ({ mother, father }): LoadState => ({
                  kitten,
                  mother,
                  father,
                  error: '',
                  notFound: false,
                  loaded: true,
                }),
              ),
            );
          }),
          catchError((error: unknown) => {
            // 400 counts as missing too: the backend answers it for an `_id`
            // that is not a well-formed one, which is a malformed address
            // rather than a service that is down. 404 is the same address
            // being valid but naming nothing the API will serve.
            const missing =
              error instanceof HttpErrorResponse && (error.status === 404 || error.status === 400);
            return of<LoadState>({
              kitten: null,
              mother: null,
              father: null,
              error: missing ? '' : this.i18n.t('error'),
              notFound: missing,
              loaded: true,
            });
          }),
        ),
      ),
    ),
    {
      initialValue: {
        kitten: null,
        mother: null,
        father: null,
        error: '',
        notFound: false,
        loaded: false,
      } satisfies LoadState,
    },
  );

  protected readonly isLoading = computed(() => !this.loadState().loaded);
  protected readonly loadError = computed(() => this.loadState().error);
  protected readonly notFound = computed(() => this.loadState().notFound);
  protected readonly kitten = computed(() => this.loadState().kitten);
  protected readonly mother = computed(() => this.loadState().mother);
  protected readonly father = computed(() => this.loadState().father);

  protected readonly name = computed(() => {
    const k = this.kitten();
    if (!k) return this.i18n.t('kittens');
    // Matches ParentComponent: show (and index) the name in the active language.
    return this.i18n.getLanguage() === 'uk'
      ? k.nameUa || k.nameEn || this.i18n.t('kittens')
      : k.nameEn || k.nameUa || this.i18n.t('kittens');
  });

  protected readonly genderLabel = computed(() => {
    const sex = this.kitten()?.sex;
    if (sex === 'male') return this.i18n.t('male');
    if (sex === 'female') return this.i18n.t('female');
    return null;
  });

  protected readonly genderSymbol = computed((): '♂' | '♀' | null => {
    const sex = this.kitten()?.sex;
    if (sex === 'male') return '♂';
    if (sex === 'female') return '♀';
    return null;
  });

  protected readonly ageLabel = computed(() => formatAgeShort(this.kitten()?.birthDay, this.i18n));

  /** Shown with a currency sign, since the admin side stores bare numbers too. */
  protected readonly petPrice = computed(() => withCurrency(this.kitten()?.price?.pet));
  protected readonly breedingPrice = computed(() => withCurrency(this.kitten()?.price?.breeding));

  private readonly sortedImages = computed(() => {
    const kitten = this.kitten();
    if (!kitten?.images?.length) return [];
    const mainIdx = kitten.images.findIndex((img) => img.isMain);
    if (mainIdx > 0) {
      const sorted = [...kitten.images];
      const [main] = sorted.splice(mainIdx, 1);
      sorted.unshift(main);
      return sorted;
    }
    return kitten.images;
  });

  private readonly photoSlides = computed<PhotoSlide[]>(() =>
    this.sortedImages().map((img) => ({
      kind: 'photo' as const,
      key: img.full,
      // Replaced once the final order is known; the video shifts every photo
      // after the first one along by one.
      viewerIndex: 0,
      display: scaledImage(img.full, STAGE_WIDTH),
      zoom: scaledImage(img.full, VIEWER_WIDTH),
      thumb: img.thumbnail || img.mobile || scaledImage(img.full, STAGE_WIDTH),
    })),
  );

  /** The kitten's video, or null — the API sends an id only when there is one. */
  private readonly video = computed(() => kittenVideo(this.kitten()?.videoId));

  /**
   * The gallery in the order it is shown: the main photo, then the video, then
   * the remaining photos.
   *
   * Second rather than first on purpose — the main photo is what the page is
   * recognised by and what every card links to, so it keeps the opening slot,
   * and the video sits where it is seen without displacing it. A kitten with a
   * single photo therefore ends up with the video last, which is the same rule
   * and not a special case.
   */
  protected readonly slides = computed<GallerySlide[]>(() => {
    const photos = this.photoSlides();
    const video = this.video();
    const videoSlide: VideoSlide[] = video
      ? [
          {
            kind: 'video' as const,
            key: `video:${video.id}`,
            // Replaced below, once the placeholder is known to be in or out.
            viewerIndex: 0,
            display: video.thumb,
            thumb: video.thumb,
            embed: video.embed,
            watch: video.watch,
            id: video.id,
          },
        ]
      : [];

    const ordered: GallerySlide[] = photos.length
      ? [photos[0], ...videoSlide, ...photos.slice(1)]
      : // No photos at all: the placeholder holds the first slot rather than
        // the video, so the stage of a kitten without pictures looks the same
        // as it always has and `og:image` keeps pointing at an image of a cat.
        [
          { kind: 'placeholder' as const, key: 'placeholder', display: KITTEN_PLACEHOLDER },
          ...videoSlide,
        ];

    let viewerIndex = 0;
    return ordered.map((slide) =>
      slide.kind === 'placeholder' ? slide : { ...slide, viewerIndex: ++viewerIndex },
    );
  });

  /** How many slides the lightbox actually holds, for the counter's label. */
  protected readonly viewerCount = computed(
    () => this.slides().filter((slide) => slide.kind !== 'placeholder').length,
  );

  /** Dimensions the lightbox sizes a video slide to, read by the template. */
  protected readonly videoSlideWidth = VIDEO_SLIDE_WIDTH;
  protected readonly videoSlideHeight = VIDEO_SLIDE_HEIGHT;

  /** True while the stage shows the video, which hides the photo-only chrome. */
  protected readonly hasVideo = computed(() => this.video() !== null);

  /** Clamped so a leftover index from the previous kitten can't blank the stage. */
  protected readonly selectedIndex = computed(() => {
    const count = this.slides().length;
    if (!count) return 0;
    return Math.min(Math.max(this.requestedImageIndex(), 0), count - 1);
  });

  /**
   * The image that represents the kitten in `og:image` and in the structured
   * data. Always the main photo, never the slide on screen: the video's poster
   * is hosted by YouTube and a social card built from it would show a play
   * button instead of the cat, and a crawler only ever sees the first render
   * anyway, so following the visitor's clicks here bought nothing.
   */
  protected readonly selectedImage = computed(
    () => this.sortedImages()[0]?.full ?? KITTEN_PLACEHOLDER,
  );

  constructor() {
    // Opening a different kitten starts the gallery from its first photo again.
    effect(() => {
      void this.kitten()?._id;
      this.requestedImageIndex.set(0);
    });

    // Detail pages are server-rendered, so the crawler already receives the
    // kitten's own title, snippet and social image rather than a generic one.
    effect(() => {
      if (this.notFound()) {
        this.seo.applyNotFound(`/kittens/${this.routeParam()}`);
        return;
      }

      const kitten = this.kitten();
      if (!kitten) {
        return;
      }

      this.seo.applyKitten({
        path: `/kittens/${catRouteParam(kitten)}`,
        name: this.name(),
        breed: taxonomyName(kitten.breed, this.i18n),
        color: taxonomyName(kitten.color, this.i18n),
        age: this.formatBirthDay(kitten.birthDay),
        image: this.selectedImage(),
        // Status and price turn the page into an offer in the structured data,
        // which is what a "kittens for sale" query can match.
        status: mapStatus(kitten.status),
        prices: [kitten.price?.pet ?? null, kitten.price?.breeding ?? null],
      });
    });

    // Reported from here rather than from the router, because the name and
    // breed only exist once the API has answered. The guard keeps a language
    // switch or a photo change from counting as a second view of the same
    // kitten; a real navigation destroys the component and resets it.
    let reportedId = '';
    effect(() => {
      const kitten = this.kitten();
      if (!kitten || kitten._id === reportedId) {
        return;
      }

      reportedId = kitten._id;
      this.analytics.trackKittenView({
        id: kitten._id,
        name: this.name(),
        breed: taxonomyName(kitten.breed, this.i18n),
        sex: kitten.sex,
        status: kitten.status,
      });
    });
  }

  protected selectSlide(index: number): void {
    this.requestedImageIndex.set(index);
    // Photo browsing is the clearest sign of interest on this page, so it is
    // worth seeing next to the kittens visitors leave without looking at.
    this.analytics.noteInteraction(
      this.slides()[index]?.kind === 'video' ? 'gallery_video' : 'gallery_photo',
    );
  }

  /**
   * Reported when the video is opened, which is also when the player is
   * created — the slide carries only a poster until then, so this fires once
   * per visitor rather than on every page view.
   */
  protected trackVideoOpen(slide: VideoSlide): void {
    const kitten = this.kitten();
    if (!kitten) {
      return;
    }

    this.analytics.trackKittenVideo({
      kittenId: kitten._id,
      kittenName: this.name(),
      videoId: slide.id,
    });
  }

  protected formatBirthDay(birthDay?: string): string {
    if (!birthDay) return '—';
    const date = new Date(birthDay);
    if (Number.isNaN(date.getTime())) return '—';
    const locale = this.i18n.getLanguage() === 'uk' ? 'uk-UA' : 'en-GB';
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  protected parentName(parent: ParentApiItem): string {
    return parent.nameUa || parent.nameEn || '—';
  }

  /** The parent's own page address: its slug when it has one. */
  protected parentRouteParam(parent: ParentApiItem): string {
    return catRouteParam(parent);
  }

  protected pickParentImage(parent: ParentApiItem): string {
    const images = parent.images;
    if (!images || images.length === 0) return PARENT_PLACEHOLDER;
    return images.find((i) => i.isMain)?.full ?? images[0].full ?? PARENT_PLACEHOLDER;
  }
}
