import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { FamiliesService, type FamilyApiItem } from './families.service';
import { ParentsService, type ParentApiItem } from '../parents/parents.service';
import { KittensService, type KittenApiItem } from '../kittens/kittens.service';
import { I18nService } from '../../services/i18n.service';
import { FiltersService, type Pagination } from '../../services/filters.service';
import {
  FilterPanelComponent,
  type FilterChange,
  type FilterConfig,
} from '../../components/filter-panel/filter-panel.component';

type KittenStatus = 'available' | 'reserved' | 'offline';

interface FamilyParentView {
  id: string;
  name: string;
  breed: string;
  image: string;
}

interface FamilyKittenView {
  id: string;
  name: string;
  breed: string;
  status: KittenStatus;
  image: string;
}

interface FamilyView {
  id: string;
  name: string;
  breed: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  mom: FamilyParentView | null;
  dad: FamilyParentView | null;
  kittens: FamilyKittenView[];
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1518288774672-b94e808873ff?auto=format&fit=crop&w=800&q=80';

const SKELETON_ITEMS: readonly number[] = [0, 1, 2];
const SKELETON_KITTEN_ITEMS: readonly number[] = [0, 1, 2, 3];

const PER_PAGE = 10;
const LOOKUP_PER_PAGE = 1000;

@Component({
  selector: 'app-families',
  imports: [CommonModule, RouterLink, FilterPanelComponent],
  templateUrl: './families.component.html',
  styleUrl: './families.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamiliesComponent {
  private readonly familiesService = inject(FamiliesService);
  private readonly parentsService = inject(ParentsService);
  private readonly kittensService = inject(KittensService);
  private readonly filtersService = inject(FiltersService);
  protected readonly i18n = inject(I18nService);

  protected readonly activeBreed = signal<string>('all');
  protected readonly breeds = this.filtersService.breeds;

  protected readonly families = signal<FamilyView[]>([]);
  protected readonly pagination = signal<Pagination | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');

  private readonly page = signal(1);
  private readonly parentMap = new Map<string, ParentApiItem>();
  private readonly kittenMap = new Map<string, KittenApiItem>();

  protected readonly hasNextPage = computed(() => this.pagination()?.hasNextPage ?? false);
  protected readonly skeletons = SKELETON_ITEMS;
  protected readonly skeletonKittens = SKELETON_KITTEN_ITEMS;

  protected readonly filterConfigs = computed<FilterConfig[]>(() => [
    {
      key: 'breed',
      label: this.i18n.t('filterByBreed'),
      options: [
        { value: 'all', label: this.i18n.t('allBreeds') },
        ...this.breeds().map((b) => ({ value: b, label: b })),
      ],
      value: this.activeBreed(),
    },
  ]);

  constructor() {
    effect(() => {
      const breed = this.activeBreed();
      untracked(() => this.reload(breed));
    });
  }

  protected setBreed(breed: string): void {
    this.activeBreed.set(breed);
  }

  protected onFilterChange(change: FilterChange): void {
    if (change.key === 'breed') {
      this.setBreed(change.value);
    }
  }

  protected onResetFilters(): void {
    this.setBreed('all');
  }

  protected retry(): void {
    this.reload(this.activeBreed());
  }

  protected loadMore(): void {
    if (!this.hasNextPage() || this.isLoading()) {
      return;
    }
    this.page.update((p) => p + 1);
    this.fetchFamilies();
  }

  protected formatDate(iso: string): string {
    if (!iso) {
      return '';
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const locale = this.i18n.getLanguage() === 'uk' ? 'uk-UA' : 'en-GB';
    return date.toLocaleDateString(locale);
  }

  protected getStatusLabel(status: KittenStatus): string {
    if (status === 'reserved') {
      return this.i18n.t('reserved');
    }
    if (status === 'offline') {
      return this.i18n.t('sold');
    }
    return this.i18n.t('available');
  }

  private reload(breed: string): void {
    this.page.set(1);
    this.families.set([]);
    this.pagination.set(null);
    this.isLoading.set(true);
    this.loadError.set('');

    forkJoin({
      families: this.familiesService.getFamilies({
        page: 1,
        perPage: PER_PAGE,
        breed: breed === 'all' ? undefined : breed,
      }),
      parents: this.parentsService.getParents({ perPage: LOOKUP_PER_PAGE }),
      kittens: this.kittensService.getKittens({ perPage: LOOKUP_PER_PAGE }),
    }).subscribe({
      next: ({ families, parents, kittens }) => {
        this.parentMap.clear();
        for (const p of parents.data ?? []) {
          this.parentMap.set(p._id, p);
        }
        this.kittenMap.clear();
        for (const k of kittens.data ?? []) {
          this.kittenMap.set(k._id, k);
        }
        this.families.set(buildFamilyViews(families.data ?? [], this.parentMap, this.kittenMap));
        this.pagination.set(families.pagination ?? null);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set(this.i18n.t('error'));
        this.isLoading.set(false);
      },
    });
  }

  private fetchFamilies(): void {
    this.isLoading.set(true);
    this.loadError.set('');
    const breed = this.activeBreed();
    this.familiesService
      .getFamilies({
        page: this.page(),
        perPage: PER_PAGE,
        breed: breed === 'all' ? undefined : breed,
      })
      .subscribe({
        next: (response) => {
          const views = buildFamilyViews(response.data ?? [], this.parentMap, this.kittenMap);
          this.families.update((prev) => (this.page() === 1 ? views : [...prev, ...views]));
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

function buildFamilyViews(
  families: FamilyApiItem[],
  parentMap: Map<string, ParentApiItem>,
  kittenMap: Map<string, KittenApiItem>,
): FamilyView[] {
  return [...families]
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((family) => ({
      id: family._id,
      name: family.name,
      breed: family.breed,
      displayOrder: family.displayOrder ?? 0,
      createdAt: family.createdAt,
      updatedAt: family.updatedAt,
      mom: resolveParent(family.parents?.mom, parentMap),
      dad: resolveParent(family.parents?.dad, parentMap),
      kittens: (family.kittens ?? [])
        .map((id) => kittenMap.get(id))
        .filter((k): k is KittenApiItem => k !== undefined)
        .map(toKittenView),
    }));
}

function resolveParent(
  id: string | null | undefined,
  parentMap: Map<string, ParentApiItem>,
): FamilyParentView | null {
  if (!id) {
    return null;
  }
  const parent = parentMap.get(id);
  if (!parent) {
    return null;
  }
  return {
    id: parent._id,
    name: parent.nameUa || parent.nameEn || '—',
    breed: parent.breed ?? '',
    image: pickImage(parent.images),
  };
}

function toKittenView(kitten: KittenApiItem): FamilyKittenView {
  return {
    id: kitten._id,
    name: kitten.nameUa || kitten.nameEn || '—',
    breed: kitten.breed ?? '',
    status: mapStatus(kitten.status),
    image: pickImage(kitten.images),
  };
}

function pickImage(images: ReadonlyArray<{ full: string; isMain?: boolean }> | undefined): string {
  if (!images || images.length === 0) {
    return FALLBACK_IMAGE;
  }
  return images.find((i) => i.isMain)?.full ?? images[0].full ?? FALLBACK_IMAGE;
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
