import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
import { KittensService, type KittenApiItem } from '../kittens/kittens.service';

interface LoadState {
  kitten: KittenApiItem | null;
  error: string;
  loaded: boolean;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1518288774672-b94e808873ff?auto=format&fit=crop&w=1200&q=80';

const STATUS_MAP: Record<string, string> = {
  available: 'Свободен',
  reserved: 'Резерв',
  offline: 'Неактивен',
  sold: 'Продан',
};

@Component({
  selector: 'app-kitten',
  imports: [RouterLink],
  templateUrl: './kitten.component.html',
  styleUrl: './kitten.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KittenComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly kittensService = inject(KittensService);

  protected readonly selectedImageIndex = signal(0);

  private readonly loadState = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id') ?? ''),
      switchMap((id) =>
        this.kittensService.getKittenById(id).pipe(
          map((kitten): LoadState => ({ kitten, error: '', loaded: true })),
          catchError(() =>
            of<LoadState>({
              kitten: null,
              error: 'Не удалось загрузить данные о котенке.',
              loaded: true,
            }),
          ),
        ),
      ),
    ),
    { initialValue: { kitten: null, error: '', loaded: false } satisfies LoadState },
  );

  protected readonly isLoading = computed(() => !this.loadState().loaded);
  protected readonly loadError = computed(() => this.loadState().error);
  protected readonly kitten = computed(() => this.loadState().kitten);

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

  protected readonly selectedImage = computed(() => {
    const imgs = this.images();
    if (!imgs.length) return FALLBACK_IMAGE;
    return imgs[this.selectedImageIndex()]?.full ?? imgs[0]?.full ?? FALLBACK_IMAGE;
  });

  protected selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  protected formatBirthDay(birthDay?: string): string {
    if (!birthDay) return 'Не указана';
    const date = new Date(birthDay);
    if (Number.isNaN(date.getTime())) return 'Не указана';
    return date.toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  protected formatSex(sex?: string): string {
    if (sex === 'female') return 'Девочка';
    if (sex === 'male') return 'Мальчик';
    return 'Не указан';
  }

  protected getStatusLabel(status?: string): string {
    return STATUS_MAP[status ?? ''] ?? 'Неизвестно';
  }
}
