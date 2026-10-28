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
  KITTEN_PLACEHOLDER,
  PARENT_PLACEHOLDER,
} from '../../services/kitten-view.util';
import { PhotoViewerDirective } from '../../components/photo-viewer/photo-viewer.directive';
import { SeoService } from '../../services/seo.service';
import { AnalyticsService } from '../../services/analytics.service';
import { LocalizedPathPipe } from '../../pipes/localized-path.pipe';
import { ImageFallbackDirective } from '../../components/image-fallback/image-fallback.directive';
import { STAGE_WIDTH, VIEWER_WIDTH, scaledImage } from '../../services/image-url.util';

interface GalleryImage {
  /** Shown on the page, at the photo's own aspect ratio. */
  display: string;
  /** Opened by the lightbox — the same photo, larger. */
  zoom: string;
  /** Square crop, which is what the thumbnail strip wants. */
  thumb: string;
}

interface LoadState {
  kitten: KittenApiItem | null;
  mother: ParentApiItem | null;
  father: ParentApiItem | null;
  error: string;
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

  private readonly loadState = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id') ?? ''),
      switchMap((id) =>
        this.kittensService.getKittenById(id).pipe(
          switchMap((kitten) => {
            const momId = kitten.parentId?.mom ?? null;
            const dadId = kitten.parentId?.dad ?? null;
            return forkJoin({
              mother: momId
                ? this.parentsService.getParentById(momId).pipe(catchError(() => of(null)))
                : of(null),
              father: dadId
                ? this.parentsService.getParentById(dadId).pipe(catchError(() => of(null)))
                : of(null),
            }).pipe(
              map(
                ({ mother, father }): LoadState => ({
                  kitten,
                  mother,
                  father,
                  error: '',
                  loaded: true,
                }),
              ),
            );
          }),
          catchError(() =>
            of<LoadState>({
              kitten: null,
              mother: null,
              father: null,
              error: this.i18n.t('error'),
              loaded: true,
            }),
          ),
        ),
      ),
    ),
    {
      initialValue: {
        kitten: null,
        mother: null,
        father: null,
        error: '',
        loaded: false,
      } satisfies LoadState,
    },
  );

  protected readonly isLoading = computed(() => !this.loadState().loaded);
  protected readonly loadError = computed(() => this.loadState().error);
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

  protected readonly ageLabel = computed(() =>
    formatAgeShort(this.kitten()?.birthDay, this.i18n),
  );

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

  protected readonly images = computed<GalleryImage[]>(() =>
    this.sortedImages().map((img) => ({
      display: scaledImage(img.full, STAGE_WIDTH),
      zoom: scaledImage(img.full, VIEWER_WIDTH),
      thumb: img.thumbnail || img.mobile || scaledImage(img.full, STAGE_WIDTH),
    })),
  );

  /** Clamped so a leftover index from the previous kitten can't blank the stage. */
  protected readonly selectedImageIndex = computed(() => {
    const count = this.sortedImages().length;
    if (!count) return 0;
    return Math.min(Math.max(this.requestedImageIndex(), 0), count - 1);
  });

  /** The original, for `og:image` and for the empty-gallery fallback. */
  protected readonly selectedImage = computed(() => {
    const imgs = this.sortedImages();
    if (!imgs.length) return KITTEN_PLACEHOLDER;
    return imgs[this.selectedImageIndex()]?.full ?? imgs[0]?.full ?? KITTEN_PLACEHOLDER;
  });

  constructor() {
    // Opening a different kitten starts the gallery from its first photo again.
    effect(() => {
      void this.kitten()?._id;
      this.requestedImageIndex.set(0);
    });

    // Detail pages are server-rendered, so the crawler already receives the
    // kitten's own title, snippet and social image rather than a generic one.
    effect(() => {
      const kitten = this.kitten();
      if (!kitten) {
        return;
      }

      this.seo.applyKitten({
        path: `/kittens/${kitten._id}`,
        name: this.name(),
        breed: kitten.breed ?? '',
        color: kitten.color ?? '',
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
        breed: kitten.breed,
        sex: kitten.sex,
        status: kitten.status,
      });
    });
  }

  protected selectImage(index: number): void {
    this.requestedImageIndex.set(index);
    // Photo browsing is the clearest sign of interest on this page, so it is
    // worth seeing next to the kittens visitors leave without looking at.
    this.analytics.noteInteraction('gallery_photo');
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

  protected pickParentImage(parent: ParentApiItem): string {
    const images = parent.images;
    if (!images || images.length === 0) return PARENT_PLACEHOLDER;
    return images.find((i) => i.isMain)?.full ?? images[0].full ?? PARENT_PLACEHOLDER;
  }
}

