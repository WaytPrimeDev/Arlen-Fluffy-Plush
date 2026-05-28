import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { KittensService, type KittenApiItem } from './kittens.service';
import { FamiliesService, type FamilyApiItem } from '../families/families.service';
import { ParentsService, type ParentApiItem } from '../parents/parents.service';
import { I18nService } from '../../services/i18n.service';
import { FiltersService } from '../../services/filters.service';
import { CommonModule } from '@angular/common';
import { type SelectOption } from '../../components/select/select.component';
import {
  FilterPanelComponent,
  type FilterChange,
  type FilterConfig,
} from '../../components/filter-panel/filter-panel.component';

type ViewMode = 'all' | 'grouped' | 'parents';
type GenderFilter = 'all' | 'male' | 'female';
type KittenStatus = 'available' | 'reserved' | 'offline'; // kept for mapStatus return type

interface ParentOption {
  id: string;
  name: string;
}

interface LitterParentView {
  id: string;
  name: string;
  breed: string;
  color: string;
  image: string;
}

interface LitterView {
  key: string;
  familyName: string;
  mother: LitterParentView | null;
  father: LitterParentView | null;
  kittens: KittenListItem[];
}

interface KittenListItem {
  id: string;
  name: string;
  breed: string;
  age: string;
  color: string;
  status: KittenStatus;
  priceLabel: string;
  image: string;
  gender: 'male' | 'female' | 'unknown';
  motherId: string | null;
  fatherId: string | null;
}

interface ParentDisplayCard {
  id: string;
  name: string;
  breed: string;
  color: string;
  image: string;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1518288774672-b94e808873ff?auto=format&fit=crop&w=1200&q=80';

const LOOKUP_PER_PAGE = 1000;

@Component({
  selector: 'app-kittens',
  imports: [RouterLink, CommonModule, FilterPanelComponent],
  templateUrl: './kittens.component.html',
  styleUrl: './kittens.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KittensComponent {
  private readonly kittensService = inject(KittensService);
  private readonly parentsService = inject(ParentsService);
  private readonly familiesService = inject(FamiliesService);
  private readonly filtersService = inject(FiltersService);
  protected readonly i18n = inject(I18nService);

  private readonly parentMap = new Map<string, ParentApiItem>();

  protected readonly viewMode = signal<ViewMode>('grouped');
  protected readonly selectedMother = signal<string>('all');
  protected readonly selectedFather = signal<string>('all');
  protected readonly selectedGender = signal<GenderFilter>('all');
  protected readonly selectedBreed = signal<string>('all');

  protected readonly kittens = signal<KittenListItem[]>([]);
  protected readonly parents = signal<ParentApiItem[]>([]);
  protected readonly families = signal<FamilyApiItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');

  protected readonly breeds = this.filtersService.breeds;

  protected readonly mothers = computed<ParentOption[]>(() =>
    this.parents()
      .filter((p) => p.sex === 'female')
      .map((p) => ({ id: p._id, name: p.nameUa || p.nameEn || '—' })),
  );

  protected readonly fathers = computed<ParentOption[]>(() =>
    this.parents()
      .filter((p) => p.sex === 'male')
      .map((p) => ({ id: p._id, name: p.nameUa || p.nameEn || '—' })),
  );

  protected readonly motherOptions = computed<SelectOption[]>(() => [
    { value: 'all', label: this.i18n.t('allMothers') },
    ...this.mothers().map((m) => ({ value: m.id, label: m.name })),
  ]);

  protected readonly fatherOptions = computed<SelectOption[]>(() => [
    { value: 'all', label: this.i18n.t('allFathers') },
    ...this.fathers().map((f) => ({ value: f.id, label: f.name })),
  ]);

  protected readonly genderOptions = computed<SelectOption[]>(() => [
    { value: 'all', label: this.i18n.t('allGenders') },
    { value: 'male', label: this.i18n.t('male') },
    { value: 'female', label: this.i18n.t('female') },
  ]);

  protected readonly breedOptions = computed<SelectOption[]>(() => [
    { value: 'all', label: this.i18n.t('allBreeds') },
    ...this.breeds().map((b) => ({ value: b, label: b })),
  ]);

  protected readonly showKittenOnlyFilters = computed(() => this.viewMode() !== 'parents');

  protected readonly filterConfigs = computed<FilterConfig[]>(() => {
    const breedFilter: FilterConfig = {
      key: 'breed',
      label: this.i18n.t('filterByBreed'),
      options: this.breedOptions(),
      value: this.selectedBreed(),
    };
    if (!this.showKittenOnlyFilters()) {
      return [breedFilter];
    }
    return [
      {
        key: 'mother',
        label: this.i18n.t('filterByMother'),
        options: this.motherOptions(),
        value: this.selectedMother(),
      },
      {
        key: 'father',
        label: this.i18n.t('filterByFather'),
        options: this.fatherOptions(),
        value: this.selectedFather(),
      },
      {
        key: 'gender',
        label: this.i18n.t('filterByGender'),
        options: this.genderOptions(),
        value: this.selectedGender(),
      },
      breedFilter,
    ];
  });

  protected readonly hasActiveFilters = computed(
    () =>
      this.selectedMother() !== 'all' ||
      this.selectedFather() !== 'all' ||
      this.selectedGender() !== 'all' ||
      this.selectedBreed() !== 'all',
  );

  protected readonly filteredKittens = computed(() => {
    const mother = this.selectedMother();
    const father = this.selectedFather();
    const gender = this.selectedGender();
    const breed = this.selectedBreed();

    return this.kittens().filter((k) => {
      if (mother !== 'all' && k.motherId !== mother) return false;
      if (father !== 'all' && k.fatherId !== father) return false;
      if (gender !== 'all' && k.gender !== gender) return false;
      if (breed !== 'all' && k.breed !== breed) return false;
      return true;
    });
  });

  protected readonly groupedByParents = computed<LitterView[]>(() => {
    const sorted = [...this.families()].sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
    );
    const filtered = this.filteredKittens();
    const filteredById = new Map(filtered.map((k) => [k.id, k]));

    return sorted
      .map((family) => {
        const momId = family.parents?.mom ?? null;
        const dadId = family.parents?.dad ?? null;
        const litterKittens = (family.kittens ?? [])
          .map((kittenId) => filteredById.get(kittenId))
          .filter((k): k is KittenListItem => k !== undefined);
        if (litterKittens.length === 0) return null;

        return {
          key: family._id,
          familyName: family.name,
          mother: momId ? toLitterParentView(this.parentMap.get(momId)) : null,
          father: dadId ? toLitterParentView(this.parentMap.get(dadId)) : null,
          kittens: litterKittens,
        } satisfies LitterView;
      })
      .filter((l): l is LitterView => l !== null);
  });

  protected readonly parentsBreedFiltered = computed<ParentApiItem[]>(() => {
    const breed = this.selectedBreed();
    return this.parents().filter((p) => breed === 'all' || p.breed === breed);
  });

  protected readonly queens = computed<ParentDisplayCard[]>(() =>
    this.parentsBreedFiltered()
      .filter((p) => p.sex === 'female')
      .map(toParentCard),
  );

  protected readonly studs = computed<ParentDisplayCard[]>(() =>
    this.parentsBreedFiltered()
      .filter((p) => p.sex === 'male')
      .map(toParentCard),
  );

  constructor() {
    this.loadAll();
  }

  protected setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  protected setMother(id: string): void {
    this.selectedMother.set(id);
  }

  protected setFather(id: string): void {
    this.selectedFather.set(id);
  }

  protected setGender(gender: string): void {
    this.selectedGender.set(gender as GenderFilter);
  }

  protected setBreed(breed: string): void {
    this.selectedBreed.set(breed);
  }

  protected onFilterChange(change: FilterChange): void {
    switch (change.key) {
      case 'mother':
        this.setMother(change.value);
        break;
      case 'father':
        this.setFather(change.value);
        break;
      case 'gender':
        this.setGender(change.value);
        break;
      case 'breed':
        this.setBreed(change.value);
        break;
    }
  }

  protected resetFilters(): void {
    this.selectedMother.set('all');
    this.selectedFather.set('all');
    this.selectedGender.set('all');
    this.selectedBreed.set('all');
  }

  private loadAll(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    forkJoin({
      kittens: this.kittensService.getKittens({ perPage: LOOKUP_PER_PAGE }),
      parents: this.parentsService.getParents({ perPage: LOOKUP_PER_PAGE }),
      families: this.familiesService.getFamilies({ perPage: LOOKUP_PER_PAGE }),
    }).subscribe({
      next: ({ kittens, parents, families }) => {
        this.parentMap.clear();
        for (const p of parents.data ?? []) {
          this.parentMap.set(p._id, p);
        }
        this.kittens.set((kittens.data ?? []).map(mapKittenToListItem));
        this.parents.set(parents.data ?? []);
        this.families.set(families.data ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set(this.i18n.t('error'));
        this.isLoading.set(false);
      },
    });
  }
}

function toLitterParentView(parent: ParentApiItem | undefined): LitterParentView | null {
  if (!parent) return null;
  return {
    id: parent._id,
    name: parent.nameUa || parent.nameEn || '—',
    breed: parent.breed ?? '',
    color: parent.color ?? '',
    image: pickImage(parent.images),
  };
}

function toParentCard(parent: ParentApiItem): ParentDisplayCard {
  return {
    id: parent._id,
    name: parent.nameUa || parent.nameEn || '—',
    breed: parent.breed ?? '',
    color: parent.color ?? '',
    image: pickImage(parent.images),
  };
}

function pickImage(images: ReadonlyArray<{ full: string; isMain?: boolean }> | undefined): string {
  if (!images || images.length === 0) return FALLBACK_IMAGE;
  return images.find((i) => i.isMain)?.full ?? images[0].full ?? FALLBACK_IMAGE;
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
    image: pickImage(kitten.images),
    gender: kitten.sex === 'male' || kitten.sex === 'female' ? kitten.sex : 'unknown',
    motherId: kitten.parentId?.mom ?? null,
    fatherId: kitten.parentId?.dad ?? null,
  };
}

function mapStatus(status?: string): KittenStatus {
  if (status === 'reserved') return 'reserved';
  if (status === 'offline' || status === 'sold') return 'offline';
  return 'available';
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
    const parts: string[] = [];
    if (pet) parts.push(`pet: ${pet}`);
    if (breeding) parts.push(`breeding: ${breeding}`);
    return parts.join(' | ');
  }
  return 'Цена по запросу';
}
