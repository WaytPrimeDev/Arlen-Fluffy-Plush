import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { KittensService, type KittenApiItem } from './kittens.service';
import { FamiliesService, type FamilyApiItem } from '../families/families.service';
import { ParentsService, type ParentApiItem } from '../parents/parents.service';
import { I18nService, type Language } from '../../services/i18n.service';
import { FiltersService } from '../../services/filters.service';
import { CommonModule } from '@angular/common';
import { type SelectOption } from '../../components/select/select.component';
import {
  FilterPanelComponent,
  type FilterChange,
  type FilterConfig,
} from '../../components/filter-panel/filter-panel.component';
import { resolveDisplayName } from '../../services/translit.util';
import { formatAge, type AgeLabels } from '../../services/age.util';

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
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly parentMap = new Map<string, ParentApiItem>();

  protected readonly viewMode = signal<ViewMode>('grouped');
  protected readonly selectedMother = signal<string>('all');
  protected readonly selectedFather = signal<string>('all');
  protected readonly selectedGender = signal<GenderFilter>('all');
  protected readonly selectedBreed = signal<string>('all');
  protected readonly selectedColor = signal<string>('all');

  private readonly rawKittens = signal<KittenApiItem[]>([]);
  protected readonly parents = signal<ParentApiItem[]>([]);
  protected readonly families = signal<FamilyApiItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');

  protected readonly breeds = this.filtersService.breeds;
  protected readonly colors = this.filtersService.colors;

  /** Localized + transliterated kitten cards, recomputed on language change. */
  protected readonly kittens = computed<KittenListItem[]>(() => {
    const lang = this.i18n.language$();
    const ageLabels = this.ageLabels();
    return this.rawKittens().map((k) => this.mapKittenToListItem(k, lang, ageLabels));
  });

  private ageLabels(): AgeLabels {
    return { mo: this.i18n.t('ageMonthsShort'), d: this.i18n.t('ageDaysShort') };
  }

  protected readonly mothers = computed<ParentOption[]>(() => {
    const lang = this.i18n.language$();
    return this.parents()
      .filter((p) => p.sex === 'female')
      .map((p) => ({ id: p._id, name: resolveDisplayName(p.nameUa, p.nameEn, lang, '—') }));
  });

  protected readonly fathers = computed<ParentOption[]>(() => {
    const lang = this.i18n.language$();
    return this.parents()
      .filter((p) => p.sex === 'male')
      .map((p) => ({ id: p._id, name: resolveDisplayName(p.nameUa, p.nameEn, lang, '—') }));
  });

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

  protected readonly colorOptions = computed<SelectOption[]>(() => [
    { value: 'all', label: this.i18n.t('allColors') },
    ...this.colors().map((c) => ({ value: c, label: c })),
  ]);

  protected readonly showKittenOnlyFilters = computed(() => this.viewMode() !== 'parents');

  protected readonly filterConfigs = computed<FilterConfig[]>(() => {
    const breedFilter: FilterConfig = {
      key: 'breed',
      label: this.i18n.t('filterByBreed'),
      options: this.breedOptions(),
      value: this.selectedBreed(),
    };
    const colorFilter: FilterConfig = {
      key: 'color',
      label: this.i18n.t('filterByColor'),
      options: this.colorOptions(),
      value: this.selectedColor(),
    };
    if (!this.showKittenOnlyFilters()) {
      return [breedFilter, colorFilter];
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
      colorFilter,
    ];
  });

  protected readonly hasActiveFilters = computed(
    () =>
      this.selectedMother() !== 'all' ||
      this.selectedFather() !== 'all' ||
      this.selectedGender() !== 'all' ||
      this.selectedBreed() !== 'all' ||
      this.selectedColor() !== 'all',
  );

  protected readonly filteredKittens = computed(() => {
    const mother = this.selectedMother();
    const father = this.selectedFather();
    const gender = this.selectedGender();
    const breed = this.selectedBreed();
    const color = this.selectedColor();

    return this.kittens().filter((k) => {
      if (mother !== 'all' && k.motherId !== mother) return false;
      if (father !== 'all' && k.fatherId !== father) return false;
      if (gender !== 'all' && k.gender !== gender) return false;
      if (breed !== 'all' && k.breed !== breed) return false;
      if (color !== 'all' && k.color !== color) return false;
      return true;
    });
  });

  protected readonly groupedByParents = computed<LitterView[]>(() => {
    const lang = this.i18n.language$();
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
          mother: momId ? toLitterParentView(this.parentMap.get(momId), lang) : null,
          father: dadId ? toLitterParentView(this.parentMap.get(dadId), lang) : null,
          kittens: litterKittens,
        } satisfies LitterView;
      })
      .filter((l): l is LitterView => l !== null);
  });

  protected readonly parentsFiltered = computed<ParentApiItem[]>(() => {
    const breed = this.selectedBreed();
    const color = this.selectedColor();
    return this.parents().filter(
      (p) => (breed === 'all' || p.breed === breed) && (color === 'all' || p.color === color),
    );
  });

  protected readonly queens = computed<ParentDisplayCard[]>(() => {
    const lang = this.i18n.language$();
    return this.parentsFiltered()
      .filter((p) => p.sex === 'female')
      .map((p) => toParentCard(p, lang));
  });

  protected readonly studs = computed<ParentDisplayCard[]>(() => {
    const lang = this.i18n.language$();
    return this.parentsFiltered()
      .filter((p) => p.sex === 'male')
      .map((p) => toParentCard(p, lang));
  });

  constructor() {
    // The template binds many labels via i18n.t() (no translate pipe), so
    // re-render this OnPush page whenever the language changes.
    effect(() => {
      this.i18n.language$();
      this.cdr.markForCheck();
    });
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

  protected setColor(color: string): void {
    this.selectedColor.set(color);
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
      case 'color':
        this.setColor(change.value);
        break;
    }
  }

  protected resetFilters(): void {
    this.selectedMother.set('all');
    this.selectedFather.set('all');
    this.selectedGender.set('all');
    this.selectedBreed.set('all');
    this.selectedColor.set('all');
  }

  private mapKittenToListItem(
    kitten: KittenApiItem,
    lang: Language,
    ageLabels: AgeLabels,
  ): KittenListItem {
    return {
      id: kitten._id,
      name: resolveDisplayName(kitten.nameUa, kitten.nameEn, lang, this.i18n.t('noName')),
      breed: kitten.breed || this.i18n.t('breedNotSpecified'),
      age: formatAge(kitten.birthDay, ageLabels) ?? '',
      color: kitten.color || this.i18n.t('colorNotSpecified'),
      status: mapStatus(kitten.status),
      priceLabel: formatPrice(kitten, this.i18n.t('priceOnRequest')),
      image: pickImage(kitten.images),
      gender: kitten.sex === 'male' || kitten.sex === 'female' ? kitten.sex : 'unknown',
      motherId: kitten.parentId?.mom ?? null,
      fatherId: kitten.parentId?.dad ?? null,
    };
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
        this.rawKittens.set(kittens.data ?? []);
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

function toLitterParentView(
  parent: ParentApiItem | undefined,
  lang: Language,
): LitterParentView | null {
  if (!parent) return null;
  return {
    id: parent._id,
    name: resolveDisplayName(parent.nameUa, parent.nameEn, lang, '—'),
    breed: parent.breed ?? '',
    color: parent.color ?? '',
    image: pickImage(parent.images),
  };
}

function toParentCard(parent: ParentApiItem, lang: Language): ParentDisplayCard {
  return {
    id: parent._id,
    name: resolveDisplayName(parent.nameUa, parent.nameEn, lang, '—'),
    breed: parent.breed ?? '',
    color: parent.color ?? '',
    image: pickImage(parent.images),
  };
}

function pickImage(images: readonly { full: string; isMain?: boolean }[] | undefined): string {
  if (!images || images.length === 0) return FALLBACK_IMAGE;
  return images.find((i) => i.isMain)?.full ?? images[0].full ?? FALLBACK_IMAGE;
}

function mapStatus(status?: string): KittenStatus {
  if (status === 'reserved') return 'reserved';
  if (status === 'offline' || status === 'sold') return 'offline';
  return 'available';
}

function formatPrice(kitten: KittenApiItem, onRequest: string): string {
  const pet = kitten.price?.pet;
  const breeding = kitten.price?.breeding;
  if (pet || breeding) {
    const parts: string[] = [];
    if (pet) parts.push(`pet: ${pet}`);
    if (breeding) parts.push(`breeding: ${breeding}`);
    return parts.join(' | ');
  }
  return onRequest;
}
