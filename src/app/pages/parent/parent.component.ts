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
import { PawCountComponent } from '../../components/paw-count/paw-count.component';
import {
  formatAgeShort,
  KITTEN_PLACEHOLDER,
  PARENT_PLACEHOLDER,
  withCurrency,
} from '../../services/kitten-view.util';
import { taxonomyName } from '../../services/taxonomy';
import { HttpErrorResponse } from '@angular/common/http';
import { STAGE_WIDTH, VIEWER_WIDTH, scaledImage } from '../../services/image-url.util';
import { catRouteParam } from '../../services/cat-route.util';

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
  /**
   * The segment this record's page lives at: its slug, or its `_id` while the
   * backend has not minted one. Separate from `id`, which stays the `_id` the
   * analytics events and `@for` keys are built on, so switching the public
   * URLs over to slugs did not quietly change what gets reported.
   */
  routeParam: string;
  name: string;
  breed: string;
  color: string;
  gender: 'male' | 'female' | 'unknown';
  age: string;
  image: string;
  priceLabel: string;
  /** The two prices on their own, so the card can label each of them. */
  prices: { pet: string | null; breeding: string | null };
}

interface LoadState {
  parent: ParentApiItem | null;
  kittens: KittenCard[];
  error: string;
  /** Set for a 404 only; see the note above `loadState`. */
  notFound: boolean;
  loaded: boolean;
}

@Component({
  selector: 'app-parent',
  imports: [
    RouterLink,
    PhotoViewerDirective,
    LocalizedPathPipe,
    ImageFallbackDirective,
    PawCountComponent,
  ],
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

  /** The slug or id in the URL, kept so a 404 can name the page it was. */
  private readonly routeParam = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );

  /**
   * A cat the API will not serve is not the same failure as an API that is
   * down. A parent is published only while it still has a litter, so one whose
   * last litter is gone starts answering 404 at an address that used to work.
   * That is an ordinary dead link: it gets its own copy and `noindex`, so a
   * crawler drops the URL rather than filing a soft 404 against the site.
   */
  private readonly loadState = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id') ?? ''),
      switchMap((id) =>
        this.parentsService.getParent(id).pipe(
          switchMap((parent) => {
            const kittenIds = parent.Kittens ?? [];
            if (!kittenIds.length) {
              return of<LoadState>({
                parent,
                kittens: [],
                error: '',
                notFound: false,
                loaded: true,
              });
            }
            return forkJoin(kittenIds.map((kid) => this.kittensService.getKitten(kid))).pipe(
              map(
                (kittens): LoadState => ({
                  parent,
                  kittens: kittens.map((k) => mapKittenApiToCard(k, this.i18n)),
                  error: '',
                  notFound: false,
                  loaded: true,
                }),
              ),
              // The cat itself loaded; a litter that will not load costs the
              // kitten strip, not the page.
              catchError(() =>
                of<LoadState>({
                  parent,
                  kittens: [],
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
              parent: null,
              kittens: [],
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
        parent: null,
        kittens: [],
        error: '',
        notFound: false,
        loaded: false,
      } satisfies LoadState,
    },
  );

  protected readonly isLoading = computed(() => !this.loadState().loaded);
  protected readonly loadError = computed(() => this.loadState().error);
  protected readonly notFound = computed(() => this.loadState().notFound);
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

  /**
   * The breed and colour as words.
   *
   * They are read through `taxonomyName` rather than straight off the record
   * because the API sends a dictionary reference — `{ _id, nameUa, nameEn }` —
   * where it used to send a bare name. Interpolating that object printed
   * "[object Object]" on the page. The helper also picks the language and
   * survives the older string shape, so both deployments read the same.
   */
  protected readonly breedName = computed(() => taxonomyName(this.parent()?.breed, this.i18n, '—'));
  protected readonly colorName = computed(() => taxonomyName(this.parent()?.color, this.i18n, '—'));

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
      if (this.notFound()) {
        this.seo.applyNotFound(`/parents/${this.routeParam()}`);
        return;
      }

      const parent = this.parent();
      if (!parent) {
        return;
      }

      this.seo.applyParent({
        path: `/parents/${catRouteParam(parent)}`,
        name: this.name(),
        breed: taxonomyName(parent.breed, this.i18n),
        color: taxonomyName(parent.color, this.i18n),
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
    routeParam: catRouteParam(kitten),
    name:
      lang === 'uk' ? kitten.nameUa || kitten.nameEn || '—' : kitten.nameEn || kitten.nameUa || '—',
    breed: taxonomyName(kitten.breed, i18n, '—'),
    color: taxonomyName(kitten.color, i18n, '—'),
    gender: kitten.sex === 'male' || kitten.sex === 'female' ? kitten.sex : 'unknown',
    age: formatAgeShort(kitten.birthDay, i18n) ?? '—',
    image:
      kitten.images?.find((img) => img.isMain === true)?.full ??
      kitten.images?.[0]?.full ??
      KITTEN_PLACEHOLDER,
    priceLabel: formatPrice(kitten, i18n),
    prices: {
      pet: withCurrency(kitten.price?.pet),
      breeding: withCurrency(kitten.price?.breeding),
    },
  };
}

function formatPrice(kitten: KittenApiItem, i18n: I18nService): string {
  const pet = withCurrency(kitten.price?.pet);
  const breeding = withCurrency(kitten.price?.breeding);
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
