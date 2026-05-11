import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { ParentsService, type ParentApiItem } from '../parents/parents.service';
import { KittensService, type KittenApiItem } from '../kittens/kittens.service';

interface KittenCard {
  id: string;
  name: string;
  breed: string;
  color: string;
  sex: string;
  age: string;
  image: string;
  status: 'available' | 'reserved' | 'offline';
  priceLabel: string;
}

interface LoadState {
  parent: ParentApiItem | null;
  kittens: KittenCard[];
  error: string;
  loaded: boolean;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1518288774672-b94e808873ff?auto=format&fit=crop&w=800&q=80';

const STATUS_LABELS: Record<string, string> = {
  available: 'Свободен',
  reserved: 'Резерв',
  offline: 'Неактивен',
  sold: 'Продан',
};

@Component({
  selector: 'app-parent',
  imports: [RouterLink],
  templateUrl: './parent.component.html',
  styleUrl: './parent.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly parentsService = inject(ParentsService);
  private readonly kittensService = inject(KittensService);

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
                  kittens: kittens.map(mapKittenApiToCard),
                  error: '',
                  loaded: true,
                }),
              ),
              catchError(() =>
                of<LoadState>({ parent, kittens: [], error: '', loaded: true }),
              ),
            );
          }),
          catchError(() =>
            of<LoadState>({
              parent: null,
              kittens: [],
              error: 'Не удалось загрузить данные о родителе.',
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

  protected selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  protected formatSex(sex?: string): string {
    if (sex === 'female') return 'Кошка';
    if (sex === 'male') return 'Кот';
    return 'Не указан';
  }

  protected getStatusLabel(status?: string): string {
    return STATUS_LABELS[status ?? ''] ?? 'Неизвестно';
  }
}

function mapKittenApiToCard(kitten: KittenApiItem): KittenCard {
  return {
    id: kitten._id,
    name: kitten.nameUa || kitten.nameEn || 'Без имени',
    breed: kitten.breed || 'Порода не указана',
    color: kitten.color || 'Не указан',
    sex: kitten.sex === 'female' ? 'Девочка' : kitten.sex === 'male' ? 'Мальчик' : 'Не указан',
    age: formatBirthDay(kitten.birthDay),
    image:
      kitten.images?.find((img) => img.isMain === true)?.full ??
      kitten.images?.[0]?.full ??
      FALLBACK_IMAGE,
    status:
      kitten.status === 'reserved'
        ? 'reserved'
        : kitten.status === 'offline' || kitten.status === 'sold'
          ? 'offline'
          : 'available',
    priceLabel: formatPrice(kitten),
  };
}

function formatBirthDay(birthDay?: string): string {
  if (!birthDay) return 'Возраст не указан';
  const date = new Date(birthDay);
  if (Number.isNaN(date.getTime())) return 'Возраст не указан';
  return date.toLocaleDateString('uk-UA');
}

function formatPrice(kitten: KittenApiItem): string {
  const pet = kitten.price?.pet;
  const breeding = kitten.price?.breeding;
  if (pet || breeding) {
    return [pet && `pet: ${pet}`, breeding && `breeding: ${breeding}`]
      .filter(Boolean)
      .join(' | ');
  }
  return 'Цена по запросу';
}
