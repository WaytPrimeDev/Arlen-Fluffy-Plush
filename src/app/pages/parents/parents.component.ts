import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ParentsService, type ParentApiItem } from './parents.service';
import { I18nService } from '../../services/i18n.service';
import { FiltersService, type Pagination } from '../../services/filters.service';
import { CommonModule } from '@angular/common';

type SexFilter = 'all' | 'male' | 'female';

interface ParentListItem {
  id: string;
  name: string;
  breed: string;
  color: string;
  sex: 'male' | 'female' | 'unknown';
  kittensCount: number;
  image: string;
}

interface SexOption {
  value: SexFilter;
  label: string;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1518288774672-b94e808873ff?auto=format&fit=crop&w=800&q=80';

const PER_PAGE = 12;

@Component({
  selector: 'app-parents',
  imports: [RouterLink, CommonModule],
  templateUrl: './parents.component.html',
  styleUrl: './parents.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentsComponent {
  private readonly parentsService = inject(ParentsService);
  private readonly filtersService = inject(FiltersService);
  protected readonly i18n = inject(I18nService);

  protected readonly sexOptions = computed<SexOption[]>(() => [
    { value: 'all', label: this.i18n.t('all') },
    { value: 'female', label: this.i18n.t('female') },
    { value: 'male', label: this.i18n.t('male') },
  ]);

  protected readonly activeSex = signal<SexFilter>('all');
  protected readonly activeBreed = signal<string>('all');

  protected readonly breeds = this.filtersService.breeds;

  protected readonly parents = signal<ParentListItem[]>([]);
  protected readonly pagination = signal<Pagination | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');

  private readonly page = signal(1);

  protected readonly filteredParents = computed(() => {
    const sex = this.activeSex();
    const list = this.parents();
    return sex === 'all' ? list : list.filter((p) => p.sex === sex);
  });

  protected readonly hasNextPage = computed(() => this.pagination()?.hasNextPage ?? false);

  constructor() {
    effect(() => {
      const breed = this.activeBreed();
      untracked(() => this.reload(breed));
    });
  }

  protected setSex(sex: SexFilter): void {
    this.activeSex.set(sex);
  }

  protected setBreed(breed: string): void {
    this.activeBreed.set(breed);
  }

  protected formatSex(sex: ParentListItem['sex']): string {
    if (sex === 'female') return this.i18n.t('female');
    if (sex === 'male') return this.i18n.t('male');
    return this.i18n.t('noData');
  }

  protected loadMore(): void {
    if (!this.hasNextPage() || this.isLoading()) {
      return;
    }
    this.page.update((p) => p + 1);
    this.fetch();
  }

  private reload(breed: string): void {
    this.page.set(1);
    this.parents.set([]);
    this.pagination.set(null);
    this.fetch(breed);
  }

  private fetch(breed = this.activeBreed()): void {
    this.isLoading.set(true);
    this.loadError.set('');
    this.parentsService
      .getParents({
        page: this.page(),
        perPage: PER_PAGE,
        breed: breed === 'all' ? undefined : breed,
      })
      .subscribe({
        next: (response) => {
          const mapped = (response.data ?? []).map(mapParentToListItem);
          this.parents.update((prev) => (this.page() === 1 ? mapped : [...prev, ...mapped]));
          this.pagination.set(response.pagination ?? null);
          this.isLoading.set(false);
        },
        error: () => {
          this.loadError.set(this.i18n.t('error'));
          this.isLoading.set(false);
        },
      });
  }
}

function mapParentToListItem(parent: ParentApiItem): ParentListItem {
  return {
    id: parent._id,
    name: parent.nameUa || parent.nameEn || 'Без имени',
    breed: parent.breed || 'Порода не указана',
    color: parent.color || 'Не указан',
    sex: parent.sex === 'male' ? 'male' : parent.sex === 'female' ? 'female' : 'unknown',
    kittensCount: parent.Kittens?.length ?? 0,
    image:
      parent.images?.find((img) => img.isMain)?.full ??
      parent.images?.[0]?.full ??
      FALLBACK_IMAGE,
  };
}
