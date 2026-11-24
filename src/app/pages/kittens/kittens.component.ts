import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
  type ElementRef,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { KittensService, type KittenApiItem } from './kittens.service';
import {
  formatAgeShort,
  mapKittenToListItem,
  pickImage,
  type KittenListItem,
  PARENT_PLACEHOLDER,
} from '../../services/kitten-view.util';
import { FamiliesService, type FamilyApiItem } from '../../services/families.service';
import { ParentsService, type ParentApiItem } from '../parents/parents.service';
import { I18nService } from '../../services/i18n.service';
import { FiltersService } from '../../services/filters.service';
import { BreedsService } from '../../services/breeds.service';
import { SeoService } from '../../services/seo.service';
import { breedCover, taxonomyId, taxonomyName, type BreedRef } from '../../services/taxonomy';
import { SelectComponent, type SelectOption } from '../../components/select/select.component';
import { BreedTilesComponent } from '../../components/breed-tiles/breed-tiles.component';
import { LocalizedPathPipe } from '../../pipes/localized-path.pipe';
import { ImageFallbackDirective } from '../../components/image-fallback/image-fallback.directive';
import { PawCountComponent } from '../../components/paw-count/paw-count.component';

type ViewMode = 'all' | 'grouped';
type GenderFilter = 'all' | 'male' | 'female';
type Tab = 'kittens' | 'parents';

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
  /** The family's own `name` from the API, e.g. "литер Т". */
  name: string;
  mother: LitterParentView | null;
  father: LitterParentView | null;
  kittens: KittenListItem[];
}

interface ParentDisplayCard {
  id: string;
  name: string;
  breed: string;
  color: string;
  image: string;
}

const LOOKUP_PER_PAGE = 1000;

@Component({
  selector: 'app-kittens',
  imports: [
    RouterLink,
    SelectComponent,
    BreedTilesComponent,
    LocalizedPathPipe,
    ImageFallbackDirective,
    PawCountComponent,
  ],
  templateUrl: './kittens.component.html',
  styleUrl: './kittens.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.escape)': 'closeFilters()' },
})
export class KittensComponent {
  private readonly kittensService = inject(KittensService);
  private readonly parentsService = inject(ParentsService);
  private readonly familiesService = inject(FamiliesService);
  private readonly filtersService = inject(FiltersService);
  private readonly breedsService = inject(BreedsService);
  private readonly seo = inject(SeoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);

  /** Stand-in for a grown cat whose photo is missing, read by the template. */
  protected readonly parentPlaceholder = PARENT_PLACEHOLDER;

  private readonly parentMap = new Map<string, ParentApiItem>();

  private readonly queryParams = toSignal(this.route.queryParamMap, { initialValue: null });
  private readonly pathParams = toSignal(this.route.paramMap, { initialValue: null });

  /**
   * The breed this page is scoped to, taken from `/breeds/:slug`. Null on
   * `/kittens`, which is the same page showing every breed at once.
   */
  protected readonly breedSlugParam = computed<string | null>(
    () => this.pathParams()?.get('slug')?.trim() || null,
  );

  /** Every breed with a page of its own, for the tiles above the listing. */
  protected readonly allBreeds = signal<readonly BreedRef[]>([]);
  /** The breed record behind `breedSlugParam`, once the API has answered. */
  protected readonly activeBreed = signal<BreedRef | null>(null);
  /** True when the slug in the URL names no breed, which is a 404. */
  protected readonly breedMissing = signal(false);

  protected readonly activeBreedName = computed(() =>
    taxonomyName(this.activeBreed(), this.i18n, this.i18n.t('fallbackNoBreed')),
  );

  protected readonly activeTab = computed<Tab>(() => {
    const params = this.queryParams();
    return params?.get('tab') === 'parents' ? 'parents' : 'kittens';
  });

  /** The page opens on the full list of kittens; litters are one click away. */
  protected readonly viewMode = signal<ViewMode>('all');
  /** All filters live behind the toolbar button, so the panel starts closed. */
  protected readonly filtersOpen = signal(false);

  private readonly filtersToggle = viewChild<ElementRef<HTMLButtonElement>>('filtersToggle');
  protected readonly selectedMother = signal<string>('all');
  protected readonly selectedFather = signal<string>('all');
  protected readonly selectedGender = signal<GenderFilter>('all');
  protected readonly selectedBreed = signal<string>('all');
  protected readonly selectedColor = signal<string>('all');

  private readonly rawKittens = signal<readonly KittenApiItem[]>([]);

  /**
   * Mapped in a `computed` rather than on arrival, so the cards re-read the
   * dictionary when the visitor switches language.
   *
   * The shared mapper puts the birth date in `age`; this listing wants how old
   * the kitten is instead, so it overrides that one field. The date is left
   * alone everywhere else, including the carousel on the home page.
   */
  protected readonly kittens = computed<KittenListItem[]>(() =>
    this.rawKittens().map((kitten) => ({
      ...mapKittenToListItem(kitten, this.i18n),
      age: formatAgeShort(kitten.birthDay, this.i18n) ?? this.i18n.t('fallbackNoAge'),
    })),
  );
  protected readonly parents = signal<ParentApiItem[]>([]);
  protected readonly families = signal<FamilyApiItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');

  /**
   * `/breeds` is the list the tiles are built from; `/filters/breeds` is the
   * fallback, because the filter dictionary carries the same records and the
   * page must not lose its breed picker when one endpoint is unavailable.
   */
  protected readonly breeds = computed<readonly BreedRef[]>(() =>
    this.allBreeds().length ? this.allBreeds() : this.filtersService.breeds(),
  );
  protected readonly colors = this.filtersService.colors;

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

  /** Options carry the dictionary `_id`: the API rejects a name with a 400. */
  protected readonly breedOptions = computed<SelectOption[]>(() => [
    { value: 'all', label: this.i18n.t('allBreeds') },
    ...this.breeds().map((breed) => ({
      value: breed._id,
      label: taxonomyName(breed, this.i18n, this.i18n.t('fallbackNoBreed')),
    })),
  ]);

  protected readonly colorOptions = computed<SelectOption[]>(() => [
    { value: 'all', label: this.i18n.t('allColors') },
    ...this.colors().map((color) => ({
      value: color._id,
      label: taxonomyName(color, this.i18n, this.i18n.t('fallbackNoColor')),
    })),
  ]);

  protected readonly showKittenOnlyFilters = computed(() => this.activeTab() === 'kittens');

  /** A breed page is already scoped, so the breed select has nothing to add. */
  protected readonly showBreedFilter = computed(() => this.breedSlugParam() === null);

  /** Numbers for the hero strip, derived from what is already loaded. */
  protected readonly availableCount = computed(
    () => this.kittens().filter((kitten) => kitten.status === 'available').length,
  );

  protected readonly litterCount = computed(() => this.groupedByParents().length);

  protected readonly parentCount = computed(() => this.parents().length);

  /** How many filters are narrowing the list, shown next to the reset chip. */
  protected readonly activeFilterCount = computed(
    () =>
      [
        this.selectedMother(),
        this.selectedFather(),
        this.selectedGender(),
        this.selectedBreed(),
        this.selectedColor(),
      ].filter((value) => value !== 'all').length,
  );

  /** Placeholder cards shown while the first request is in flight. */
  protected readonly skeletons = [0, 1, 2, 3, 4, 5];

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
      // Matched on the dictionary id, not on the name: the same breed can be
      // spelled differently in each language, and the id is what the API uses.
      if (breed !== 'all' && k.breedId !== breed) return false;
      if (color !== 'all' && k.colorId !== color) return false;
      return true;
    });
  });

  protected readonly groupedByParents = computed<LitterView[]>(() => {
    const sorted = [...this.families()].sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
    );
    const filtered = this.filteredKittens();

    return sorted
      .map((family) => {
        /**
         * Membership is read off the kitten's own `familyId`, with the family's
         * `kittens` array as the fallback: those are the two links the API
         * actually fills in. Matching on the parent pair instead left every
         * litter empty, because `family.parents` comes back null.
         */
        const memberIds = new Set(family.kittens ?? []);
        const litterKittens = filtered.filter(
          (k) => k.familyId === family._id || memberIds.has(k.id),
        );
        if (litterKittens.length === 0) return null;

        /** A family without its own parents borrows them from its kittens. */
        const momId =
          family.parents?.mom ?? litterKittens.find((k) => k.motherId)?.motherId ?? null;
        const dadId =
          family.parents?.dad ?? litterKittens.find((k) => k.fatherId)?.fatherId ?? null;

        const mother = momId ? toLitterParentView(this.parentMap.get(momId), this.i18n) : null;
        const father = dadId ? toLitterParentView(this.parentMap.get(dadId), this.i18n) : null;

        return {
          key: family._id,
          // A family without a name of its own keeps the old parents-based title.
          name:
            family.name?.trim() ||
            `${this.i18n.t('litterFrom')} ${mother?.name ?? '—'} & ${father?.name ?? '—'}`,
          mother,
          father,
          kittens: litterKittens,
        } satisfies LitterView;
      })
      .filter((l): l is LitterView => l !== null);
  });

  protected readonly parentsBreedFiltered = computed<ParentApiItem[]>(() => {
    const breed = this.selectedBreed();
    const color = this.selectedColor();
    return this.parents().filter(
      (p) =>
        (breed === 'all' || taxonomyId(p.breed) === breed) &&
        (color === 'all' || taxonomyId(p.color) === color),
    );
  });

  protected readonly queens = computed<ParentDisplayCard[]>(() =>
    this.parentsBreedFiltered()
      .filter((p) => p.sex === 'female')
      .map((parent) => toParentCard(parent, this.i18n)),
  );

  protected readonly studs = computed<ParentDisplayCard[]>(() =>
    this.parentsBreedFiltered()
      .filter((p) => p.sex === 'male')
      .map((parent) => toParentCard(parent, this.i18n)),
  );

  constructor() {
    // The tiles show every breed whatever the URL, so the list is fetched once
    // and survives a move from one breed to the next.
    this.breedsService
      .getBreeds()
      .pipe(catchError(() => of<BreedRef[]>([])))
      .subscribe((breeds) => this.allBreeds.set(breeds));

    // `/breeds/:slug` renders this same component, so moving between two
    // breeds keeps it alive and changes nothing but the parameter.
    effect(() => {
      const slug = this.breedSlugParam();
      untracked(() => this.loadAll(slug));
    });

    // A breed page carries no `seo` key in its route data, so it owns its own
    // metadata; the plain catalogue is still described by the shell. Depending
    // on the language signal re-applies the copy when the visitor switches.
    effect(() => {
      const slug = this.breedSlugParam();
      this.i18n.language$();

      if (!slug) {
        return;
      }

      if (this.breedMissing()) {
        this.seo.applyNotFound(`/breeds/${slug}`);
        return;
      }

      const breed = this.activeBreed();
      if (!breed) {
        return;
      }

      this.seo.applyBreed({
        path: `/breeds/${slug}`,
        name: taxonomyName(breed, this.i18n, this.i18n.t('fallbackNoBreed')),
        image: breedCover(breed),
        kittenCount: untracked(() => this.filteredKittens().length),
      });
    });
  }

  protected setTab(tab: Tab): void {
    this.router.navigate([], {
      queryParams: { tab: tab === 'kittens' ? null : 'parents' },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  protected toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }

  /**
   * The panel is not a dialog, so it keeps the page keyboard-navigable: Escape
   * closes it and hands focus back to the button that opened it. Bound on the
   * host, because the panel itself is not an interactive element.
   */
  protected closeFilters(): void {
    if (!this.filtersOpen()) {
      return;
    }

    this.filtersOpen.set(false);
    this.filtersToggle()?.nativeElement.focus();
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

  protected resetFilters(): void {
    this.selectedMother.set('all');
    this.selectedFather.set('all');
    this.selectedGender.set('all');
    this.selectedBreed.set('all');
    this.selectedColor.set('all');
  }

  /**
   * `role="tablist"` promises arrow-key navigation, so the tabs honour it
   * instead of leaving keyboard users with two separate tab stops.
   */
  protected onTabKeydown(event: KeyboardEvent): void {
    const order: Tab[] = ['kittens', 'parents'];
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) {
      return;
    }

    event.preventDefault();
    const next = order[(order.indexOf(this.activeTab()) + step + order.length) % order.length];
    this.setTab(next);

    const pressed = event.currentTarget as HTMLElement | null;
    pressed
      ?.closest('[role="tablist"]')
      ?.querySelector<HTMLElement>(`[data-tab="${next}"]`)
      ?.focus();
  }

  /**
   * One load for both URLs this component serves. A breed page asks the breed
   * endpoints, which apply the same "only kittens that belong to a litter" rule
   * as the general catalogue, so the two listings cannot drift apart.
   */
  private loadAll(slug: string | null): void {
    this.isLoading.set(true);
    this.loadError.set('');
    this.breedMissing.set(false);
    this.activeBreed.set(null);
    // The mothers and fathers of the previous breed are not in this one.
    this.resetFilters();

    const request = slug
      ? forkJoin({
          breed: this.breedsService.getBreed(slug).pipe(map((response) => response.breed)),
          kittens: this.breedsService.getBreedKittens(slug, { perPage: LOOKUP_PER_PAGE }),
          parents: this.breedsService.getBreedParents(slug, { perPage: LOOKUP_PER_PAGE }),
          families: this.breedsService.getBreedFamilies(slug, { perPage: LOOKUP_PER_PAGE }),
        })
      : forkJoin({
          breed: of<BreedRef | null>(null),
          kittens: this.kittensService.getKittens({ perPage: LOOKUP_PER_PAGE }),
          parents: this.parentsService.getParents({ perPage: LOOKUP_PER_PAGE }),
          families: this.familiesService.getFamilies({ perPage: LOOKUP_PER_PAGE }),
        });

    request.subscribe({
      next: ({ breed, kittens, parents, families }) => {
        this.parentMap.clear();
        for (const p of parents.data ?? []) {
          this.parentMap.set(p._id, p);
        }
        this.activeBreed.set(breed ?? null);
        this.rawKittens.set(kittens.data ?? []);
        this.parents.set(parents.data ?? []);
        this.families.set(families.data ?? []);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        // An unknown slug is a page that does not exist, not a broken API, and
        // it has to read as one: its own copy and `noindex` rather than the
        // generic "could not load" box.
        if (slug && error instanceof HttpErrorResponse && error.status === 404) {
          this.breedMissing.set(true);
        } else {
          this.loadError.set(this.i18n.t('error'));
        }
        this.isLoading.set(false);
      },
    });
  }
}

function toLitterParentView(
  parent: ParentApiItem | undefined,
  i18n: I18nService,
): LitterParentView | null {
  if (!parent) return null;
  return {
    id: parent._id,
    name: parent.nameUa || parent.nameEn || '—',
    breed: taxonomyName(parent.breed, i18n),
    color: taxonomyName(parent.color, i18n),
    image: pickImage(parent.images, PARENT_PLACEHOLDER),
  };
}

function toParentCard(parent: ParentApiItem, i18n: I18nService): ParentDisplayCard {
  return {
    id: parent._id,
    name: parent.nameUa || parent.nameEn || '—',
    breed: taxonomyName(parent.breed, i18n),
    color: taxonomyName(parent.color, i18n),
    image: pickImage(parent.images, PARENT_PLACEHOLDER),
  };
}
