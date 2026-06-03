import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { ParentsService, type ParentApiItem } from '../parents/parents.service';
import { KittensService, type KittenApiItem } from '../kittens/kittens.service';
import { I18nService, type Language } from '../../services/i18n.service';
import { PhotoViewerComponent } from '../../components/photo-viewer/photo-viewer.component';
import { resolveDisplayName } from '../../services/translit.util';
import { formatAge, type AgeLabels } from '../../services/age.util';

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
  kittens: KittenApiItem[];
  error: string;
  loaded: boolean;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1518288774672-b94e808873ff?auto=format&fit=crop&w=1200&q=80';

@Component({
  selector: 'app-parent',
  imports: [RouterLink, PhotoViewerComponent],
  templateUrl: './parent.component.html',
  styleUrl: './parent.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly parentsService = inject(ParentsService);
  private readonly kittensService = inject(KittensService);
  protected readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);

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
                  kittens,
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

  protected readonly kittens = computed<KittenCard[]>(() => {
    const lang = this.i18n.language$();
    const ageLabels: AgeLabels = {
      mo: this.i18n.t('ageMonthsShort'),
      d: this.i18n.t('ageDaysShort'),
    };
    return this.loadState().kittens.map((k) => mapKittenApiToCard(k, lang, ageLabels));
  });

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

  protected readonly mainImage = computed(() => this.images()[0]?.full ?? FALLBACK_IMAGE);

  protected readonly name = computed(() => {
    const p = this.parent();
    if (!p) return '';
    return resolveDisplayName(p.nameUa, p.nameEn, this.i18n.language$(), '—');
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
    // The template binds via i18n.t()/method calls (no translate pipe), so
    // re-render this OnPush page whenever the language changes.
    effect(() => {
      this.i18n.language$();
      this.cdr.markForCheck();
    });
  }
}

function mapKittenApiToCard(kitten: KittenApiItem, lang: Language, ageLabels: AgeLabels): KittenCard {
  return {
    id: kitten._id,
    name: resolveDisplayName(kitten.nameUa, kitten.nameEn, lang, '—'),
    breed: kitten.breed || '—',
    color: kitten.color || '—',
    gender: kitten.sex === 'male' || kitten.sex === 'female' ? kitten.sex : 'unknown',
    age: formatAge(kitten.birthDay, ageLabels) ?? '',
    image:
      kitten.images?.find((img) => img.isMain === true)?.full ??
      kitten.images?.[0]?.full ??
      FALLBACK_IMAGE,
    priceLabel: formatPrice(kitten),
  };
}

function formatPrice(kitten: KittenApiItem): string {
  const pet = kitten.price?.pet;
  const breeding = kitten.price?.breeding;
  if (pet || breeding) {
    return [pet && `pet: ${pet}`, breeding && `breeding: ${breeding}`].filter(Boolean).join(' | ');
  }
  return '—';
}
