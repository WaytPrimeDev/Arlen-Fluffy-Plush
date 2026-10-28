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
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { ParentsService, type ParentApiItem } from '../parents/parents.service';
import { KittensService, type KittenApiItem } from '../kittens/kittens.service';
import { I18nService } from '../../services/i18n.service';
import { PhotoViewerDirective } from '../../components/photo-viewer/photo-viewer.directive';
import { SeoService } from '../../services/seo.service';
import { LocalizedPathPipe } from '../../pipes/localized-path.pipe';
import { ImageFallbackDirective } from '../../components/image-fallback/image-fallback.directive';
import {
  formatAgeShort,
  KITTEN_PLACEHOLDER,
  PARENT_PLACEHOLDER,
} from '../../services/kitten-view.util';
import { STAGE_WIDTH, VIEWER_WIDTH, scaledImage } from '../../services/image-url.util';

interface GalleryImage {
  /** Shown on the page, at the photo's own aspect ratio. */
  display: string;
  /** Opened by the lightbox — the same photo, larger. */
  zoom: string;
  /** Square crop, which is what the thumbnail strip wants. */
  thumb: string;
}

interface KittenCard {
  id: string;
  name: string;
  breed: string;
  color: string;
  gender: 'male' | 'female' | 'unknown';
  age: string;
  image: string;
  priceLabel: string;
}

interface LoadState {
  parent: ParentApiItem | null;
  kittens: KittenCard[];
  error: string;
  loaded: boolean;
}

@Component({
  selector: 'app-parent',
  imports: [RouterLink, PhotoViewerDirective, LocalizedPathPipe, ImageFallbackDirective],
  templateUrl: './parent.component.html',
  styleUrl: './parent.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly parentsService = inject(ParentsService);
  private readonly kittensService = inject(KittensService);
  protected readonly i18n = inject(I18nService);

  /** Stand-in for a grown cat whose photo is missing, read by the template. */
  protected readonly parentPlaceholder = PARENT_PLACEHOLDER;
  private readonly seo = inject(SeoService);

  /** Handed to the photo viewer so it can size slides from the page's own image. */
  protected readonly stageWidth = STAGE_WIDTH;
  protected readonly viewerWidth = VIEWER_WIDTH;

  private readonly requestedImageIndex = signal(0);

  private readonly loadState = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id') ?? ''),
      switchMap((id) =>
        this.parentsService.getParentById(id).pipe(
          switchMap((parent) => {
            const kittenIds = parent.Kittens ?? [];
            if (!kittenIds.length) {
              return of<LoadState>({ parent, kittens: [], error: '', loaded: true });
            }
            return forkJoin(kittenIds.map((kid) => this.kittensService.getKittenById(kid))).pipe(
              map(
                (kittens): LoadState => ({
                  parent,
                  kittens: kittens.map((k) => mapKittenApiToCard(k, this.i18n)),
                  error: '',
                  loaded: true,
                }),
              ),
              catchError(() => of<LoadState>({ parent, kittens: [], error: '', loaded: true })),
            );
          }),
          catchError(() =>
            of<LoadState>({
              parent: null,
              kittens: [],
              error: this.i18n.t('error'),
              loaded: true,
            }),
          ),
        ),
      ),
    ),
    { initialValue: { parent: null, kittens: [], error: '', loaded: false } satisfies LoadState },
  );

  protected readonly isLoading = computed(() => !this.loadState().loaded);
  protected readonly loadError = computed(() => this.loadState().error);
  protected readonly parent = computed(() => this.loadState().parent);
  protected readonly kittens = computed(() => this.loadState().kittens);

  private readonly sortedImages = computed(() => {
    const parent = this.parent();
    if (!parent?.images?.length) return [];
    const sorted = [...parent.images];
    const mainIdx = sorted.findIndex((img) => img.isMain);
    if (mainIdx > 0) {
      const [main] = sorted.splice(mainIdx, 1);
      sorted.unshift(main);
    }
    return sorted;
  });

  protected readonly images = computed<GalleryImage[]>(() =>
    this.sortedImages().map((img) => ({
      display: scaledImage(img.full, STAGE_WIDTH),
      zoom: scaledImage(img.full, VIEWER_WIDTH),
      thumb: img.thumbnail || img.mobile || scaledImage(img.full, STAGE_WIDTH),
    })),
  );

  /** Clamped so a leftover index from the previous parent can't blank the stage. */
  protected readonly selectedImageIndex = computed(() => {
    const count = this.sortedImages().length;
    if (!count) return 0;
    return Math.min(Math.max(this.requestedImageIndex(), 0), count - 1);
  });

  /** The original, for `og:image` and for the empty-gallery fallback. */
  protected readonly selectedImage = computed(() => {
    const imgs = this.sortedImages();
    return imgs[this.selectedImageIndex()]?.full ?? imgs[0]?.full ?? PARENT_PLACEHOLDER;
  });

  protected readonly name = computed(() => {
    const p = this.parent();
    if (!p) return '';
    return this.i18n.getLanguage() === 'uk'
      ? p.nameUa || p.nameEn || '—'
      : p.nameEn || p.nameUa || '—';
  });

  protected readonly sexLabel = computed(() => {
    const sex = this.parent()?.sex;
    if (sex === 'female') return this.i18n.t('queen');
    if (sex === 'male') return this.i18n.t('stud');
    return null;
  });

  protected readonly sexSymbol = computed((): '♀' | '♂' | null => {
    const sex = this.parent()?.sex;
    if (sex === 'female') return '♀';
    if (sex === 'male') return '♂';
    return null;
  });

  protected readonly kittensSectionTitle = computed(() => {
    const sex = this.parent()?.sex;
    if (sex === 'female') return this.i18n.t('kittensOfThisQueen');
    if (sex === 'male') return this.i18n.t('kittensOfThisStud');
    return this.i18n.t('kittensOfThisParent');
  });

  constructor() {
    // Opening a different parent starts the gallery from its first photo again.
    effect(() => {
      void this.parent()?._id;
      this.requestedImageIndex.set(0);
    });

    effect(() => {
      const parent = this.parent();
      if (!parent) {
        return;
      }

      this.seo.applyParent({
        path: `/parents/${parent._id}`,
        name: this.name(),
        breed: parent.breed ?? '',
        color: parent.color ?? '',
        image: this.selectedImage(),
      });
    });
  }

  protected selectImage(index: number): void {
    this.requestedImageIndex.set(index);
  }
}

function mapKittenApiToCard(kitten: KittenApiItem, i18n: I18nService): KittenCard {
  const lang = i18n.getLanguage();
  return {
    id: kitten._id,
    name:
      lang === 'uk' ? kitten.nameUa || kitten.nameEn || '—' : kitten.nameEn || kitten.nameUa || '—',
    breed: kitten.breed || '—',
    color: kitten.color || '—',
    gender: kitten.sex === 'male' || kitten.sex === 'female' ? kitten.sex : 'unknown',
    age: formatAgeShort(kitten.birthDay, i18n) ?? '—',
    image:
      kitten.images?.find((img) => img.isMain === true)?.full ??
      kitten.images?.[0]?.full ??
      KITTEN_PLACEHOLDER,
    priceLabel: formatPrice(kitten, i18n),
  };
}

function formatPrice(kitten: KittenApiItem, i18n: I18nService): string {
  const pet = kitten.price?.pet;
  const breeding = kitten.price?.breeding;
  if (pet || breeding) {
    return [
      pet && `${i18n.t('petPrice')}: ${pet}`,
      breeding && `${i18n.t('breedingPrice')}: ${breeding}`,
    ]
      .filter(Boolean)
      .join(' | ');
  }
  return '—';
}
