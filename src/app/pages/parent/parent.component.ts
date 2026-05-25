import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { ParentsService, type ParentApiItem } from '../parents/parents.service';
import { KittensService, type KittenApiItem } from '../kittens/kittens.service';
import { I18nService } from '../../services/i18n.service';
import { PhotoViewerDirective } from '../../components/photo-viewer/photo-viewer.directive';

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

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1518288774672-b94e808873ff?auto=format&fit=crop&w=1200&q=80';

@Component({
  selector: 'app-parent',
  imports: [RouterLink, PhotoViewerDirective],
  templateUrl: './parent.component.html',
  styleUrl: './parent.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly parentsService = inject(ParentsService);
  private readonly kittensService = inject(KittensService);
  protected readonly i18n = inject(I18nService);

  protected readonly selectedImageIndex = signal(0);

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

  protected readonly images = computed(() => {
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

  protected readonly selectedImage = computed(() => {
    const imgs = this.images();
    return imgs[this.selectedImageIndex()]?.full ?? imgs[0]?.full ?? FALLBACK_IMAGE;
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

  protected selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }
}

function mapKittenApiToCard(kitten: KittenApiItem, i18n: I18nService): KittenCard {
  const lang = i18n.getLanguage();
  return {
    id: kitten._id,
    name: lang === 'uk' ? kitten.nameUa || kitten.nameEn || '—' : kitten.nameEn || kitten.nameUa || '—',
    breed: kitten.breed || '—',
    color: kitten.color || '—',
    gender: kitten.sex === 'male' || kitten.sex === 'female' ? kitten.sex : 'unknown',
    age: formatAge(kitten.birthDay),
    image:
      kitten.images?.find((img) => img.isMain === true)?.full ??
      kitten.images?.[0]?.full ??
      FALLBACK_IMAGE,
    priceLabel: formatPrice(kitten),
  };
}

function formatAge(birthDay?: string): string {
  if (!birthDay) return '—';
  const date = new Date(birthDay);
  if (Number.isNaN(date.getTime())) return '—';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return `${diffDays}d`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 8) return `${diffWeeks}w`;
  const diffMonths = Math.floor(diffDays / 30.44);
  if (diffMonths < 24) return `${diffMonths}mo`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears}y`;
}

function formatPrice(kitten: KittenApiItem): string {
  const pet = kitten.price?.pet;
  const breeding = kitten.price?.breeding;
  if (pet || breeding) {
    return [pet && `pet: ${pet}`, breeding && `breeding: ${breeding}`].filter(Boolean).join(' | ');
  }
  return '—';
}
