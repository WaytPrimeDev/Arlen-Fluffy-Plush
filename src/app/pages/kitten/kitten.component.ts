import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap, forkJoin } from 'rxjs';
import { KittensService, type KittenApiItem } from '../kittens/kittens.service';
import { ParentsService, type ParentApiItem } from '../parents/parents.service';
import { I18nService } from '../../services/i18n.service';
import { PhotoViewerDirective } from '../../components/photo-viewer/photo-viewer.directive';

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
  imports: [RouterLink, PhotoViewerDirective],
  templateUrl: './kitten.component.html',
  styleUrl: './kitten.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KittenComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly kittensService = inject(KittensService);
  private readonly parentsService = inject(ParentsService);
  protected readonly i18n = inject(I18nService);

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
              error: 'Не удалось загрузить данные о котенке.',
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
    return k?.nameUa || k?.nameEn || 'Котенок';
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

  protected readonly ageLabel = computed(() => computeAge(this.kitten()?.birthDay));

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
    return parent.nameUa || parent.nameEn || '—';
  }

  protected pickParentImage(parent: ParentApiItem): string {
    const images = parent.images;
    if (!images || images.length === 0) return FALLBACK_IMAGE;
    return images.find((i) => i.isMain)?.full ?? images[0].full ?? FALLBACK_IMAGE;
  }
}

function computeAge(birthDay?: string): string | null {
  if (!birthDay) return null;
  const date = new Date(birthDay);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return `${diffDays}д`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 8) return `${diffWeeks} нед.`;
  const diffMonths = Math.floor(diffDays / 30.44);
  if (diffMonths < 24) return `${diffMonths} мес.`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} г.`;
}
