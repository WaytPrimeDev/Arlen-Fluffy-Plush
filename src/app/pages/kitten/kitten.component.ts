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
import { catchError, map, of, switchMap, forkJoin } from 'rxjs';
import { KittensService, type KittenApiItem } from '../kittens/kittens.service';
import { ParentsService, type ParentApiItem } from '../parents/parents.service';
import { I18nService } from '../../services/i18n.service';
import { PhotoViewerComponent } from '../../components/photo-viewer/photo-viewer.component';
import { resolveDisplayName } from '../../services/translit.util';
import { formatAge } from '../../services/age.util';

interface LoadState {
  kitten: KittenApiItem | null;
  mother: ParentApiItem | null;
  father: ParentApiItem | null;
  error: string;
  loaded: boolean;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1518288774672-b94e808873ff?auto=format&fit=crop&w=1200&q=80';

@Component({
  selector: 'app-kitten',
  imports: [RouterLink, PhotoViewerComponent],
  templateUrl: './kitten.component.html',
  styleUrl: './kitten.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KittenComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly kittensService = inject(KittensService);
  private readonly parentsService = inject(ParentsService);
  protected readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    // The template binds via i18n.t()/method calls (no translate pipe), so
    // re-render this OnPush page whenever the language changes.
    effect(() => {
      this.i18n.language$();
      this.cdr.markForCheck();
    });
  }

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
              map(({ mother, father }): LoadState => ({ kitten, mother, father, error: '', loaded: true })),
            );
          }),
          catchError(() =>
            of<LoadState>({
              kitten: null,
              mother: null,
              father: null,
              error: this.i18n.t('kittenLoadError'),
              loaded: true,
            }),
          ),
        ),
      ),
    ),
    { initialValue: { kitten: null, mother: null, father: null, error: '', loaded: false } satisfies LoadState },
  );

  protected readonly isLoading = computed(() => !this.loadState().loaded);
  protected readonly loadError = computed(() => this.loadState().error);
  protected readonly kitten = computed(() => this.loadState().kitten);
  protected readonly mother = computed(() => this.loadState().mother);
  protected readonly father = computed(() => this.loadState().father);

  protected readonly name = computed(() => {
    const k = this.kitten();
    return resolveDisplayName(k?.nameUa, k?.nameEn, this.i18n.language$(), this.i18n.t('kittenFallbackName'));
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

  protected readonly ageLabel = computed(() => {
    this.i18n.language$();
    return formatAge(this.kitten()?.birthDay, {
      mo: this.i18n.t('ageMonthsShort'),
      d: this.i18n.t('ageDaysShort'),
    });
  });

  protected readonly images = computed(() => {
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

  protected readonly mainImage = computed(() => this.images()[0]?.full ?? FALLBACK_IMAGE);

  protected formatBirthDay(birthDay?: string): string {
    if (!birthDay) return '—';
    const date = new Date(birthDay);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  protected parentName(parent: ParentApiItem): string {
    return resolveDisplayName(parent.nameUa, parent.nameEn, this.i18n.language$(), '—');
  }

  protected pickParentImage(parent: ParentApiItem): string {
    const images = parent.images;
    if (!images || images.length === 0) return FALLBACK_IMAGE;
    return images.find((i) => i.isMain)?.full ?? images[0].full ?? FALLBACK_IMAGE;
  }
}
