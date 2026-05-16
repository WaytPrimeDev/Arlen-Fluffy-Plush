import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { KittensService, type KittenApiItem } from './kittens.service';
import { I18nService } from '../../services/i18n.service';
import { CommonModule } from '@angular/common';

type KittenStatus = 'available' | 'reserved' | 'offline';
type StatusFilter = KittenStatus | 'all';

interface KittenListItem {
  id: string;
  name: string;
  breed: string;
  age: string;
  color: string;
  status: KittenStatus;
  priceLabel: string;
  image: string;
  tags: string[];
}

interface StatusOption {
  value: StatusFilter;
  label: string;
}

interface LoadState {
  kittens: KittenListItem[];
  error: string;
  loaded: boolean;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1518288774672-b94e808873ff?auto=format&fit=crop&w=1200&q=80';

@Component({
  selector: 'app-kittens',
  imports: [RouterLink, CommonModule],
  templateUrl: './kittens.component.html',
  styleUrl: './kittens.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KittensComponent {
  private readonly kittensService = inject(KittensService);
  protected readonly i18n = inject(I18nService);

  protected readonly statusLabels = computed<Record<KittenStatus, string>>(() => ({
    available: this.i18n.t('available'),
    reserved: this.i18n.t('reserved'),
    offline: this.i18n.t('sold'),
  }));

  protected readonly statusOptions = computed<StatusOption[]>(() => [
    { value: 'all', label: this.i18n.t('all') },
    { value: 'available', label: this.i18n.t('available') },
    { value: 'reserved', label: this.i18n.t('reserved') },
    { value: 'offline', label: this.i18n.t('sold') },
  ]);

  protected readonly activeStatus = signal<StatusFilter>('all');

  private readonly loadState = toSignal(
    this.kittensService.getKittens().pipe(
      map(
        (kittens): LoadState => ({
          kittens: kittens.map((kitten) => mapKittenToListItem(kitten)),
          error: '',
          loaded: true,
        }),
      ),
      catchError(() =>
        of<LoadState>({
          kittens: [],
          error: this.i18n.t('error'),
          loaded: true,
        }),
      ),
    ),
    { initialValue: { kittens: [], error: '', loaded: false } satisfies LoadState },
  );

  protected readonly isLoading = computed(() => !this.loadState().loaded);
  protected readonly loadError = computed(() => this.loadState().error);
  protected readonly kittens = computed(() => this.loadState().kittens);

  protected readonly filteredKittens = computed(() => {
    const status = this.activeStatus();
    const list = this.kittens();
    return status === 'all' ? list : list.filter((kitten) => kitten.status === status);
  });

  protected setStatus(status: StatusFilter): void {
    this.activeStatus.set(status);
  }

  protected getStatusLabel(status: KittenStatus): string {
    return this.statusLabels()[status];
  }
}

function mapKittenToListItem(kitten: KittenApiItem): KittenListItem {
  return {
    id: kitten._id,
    name: kitten.nameUa || kitten.nameEn || 'Без имени',
    breed: kitten.breed || 'Порода не указана',
    age: formatBirthDay(kitten.birthDay),
    color: kitten.color || 'Цвет не указан',
    status: mapStatus(kitten.status),
    priceLabel: formatPrice(kitten),
    image:
      kitten.images?.find((image) => image.isMain === true)?.full ||
      kitten.images?.[0]?.full ||
      FALLBACK_IMAGE,
    tags: [formatSex(kitten.sex)],
  };
}

function mapStatus(status?: string): KittenStatus {
  if (status === 'reserved') {
    return 'reserved';
  }
  if (status === 'offline' || status === 'sold') {
    return 'offline';
  }
  return 'available';
}

function formatBirthDay(birthDay?: string): string {
  if (!birthDay) {
    return 'Возраст не указан';
  }
  const date = new Date(birthDay);
  if (Number.isNaN(date.getTime())) {
    return 'Возраст не указан';
  }
  return date.toLocaleDateString('uk-UA');
}

function formatPrice(kitten: KittenApiItem): string {
  const pet = kitten.price?.pet;
  const breeding = kitten.price?.breeding;

  if (pet || breeding) {
    const parts: string[] = [];
    if (pet) {
      parts.push(`pet: ${pet}`);
    }
    if (breeding) {
      parts.push(`breeding: ${breeding}`);
    }
    return parts.join(' | ');
  }
  return 'Цена по запросу';
}

function formatSex(sex?: string): string {
  if (sex === 'female') {
    return 'Девочка';
  }
  if (sex === 'male') {
    return 'Мальчик';
  }
  return 'Пол не указан';
}
