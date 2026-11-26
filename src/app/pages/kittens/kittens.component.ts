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
import { forkJoin, of, type Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { KittensService, type KittenApiItem } from './kittens.service';
import {
  formatAgeShort,
  mapKittenToListItem,
  pickImage,
  type KittenListItem,
  PARENT_PLACEHOLDER,
} from '../../services/kitten-view.util';
import {
  FamiliesService,
  familyMemberId,
  familyMemberRecord,
  type FamilyApiItem,
  type FamilyMember,
} from '../../services/families.service';
import { buildFamilyOrder } from '../../services/family-order.util';
import { ParentsService, type ParentApiItem } from '../parents/parents.service';
import { catRouteParam } from '../../services/cat-route.util';
import { I18nService } from '../../services/i18n.service';
import { FiltersService, type PaginatedResponse } from '../../services/filters.service';
import { BreedsService } from '../../services/breeds.service';
import { canonicalBreed } from '../../services/canonical-breeds';
import { SeoService } from '../../services/seo.service';
import {
  breedCover,
  breedSlug,
  taxonomyId,
  taxonomyName,
  type BreedRef,
} from '../../services/taxonomy';
import { SelectComponent, type SelectOption } from '../../components/select/select.component';
import { BreedTilesComponent } from '../../components/breed-tiles/breed-tiles.component';
import { LocalizedPathPipe } from '../../pipes/localized-path.pipe';
import { ImageFallbackDirective } from '../../components/image-fallback/image-fallback.directive';
import { PawCountComponent } from '../../components/paw-count/paw-count.component';
import { StatusPillComponent } from '../../components/status-pill/status-pill.component';
import { CardGalleryComponent } from '../../components/card-gallery/card-gallery.component';

type ViewMode = 'all' | 'grouped';
type GenderFilter = 'all' | 'male' | 'female';
type Tab = 'kittens' | 'parents';

interface ParentOption {
  id: string;
  name: string;
}

interface LitterParentView {
  id: string;
  /**
   * The segment this record's page lives at: its slug, or its `_id` while the
   * backend has not minted one. Separate from `id`, which stays the `_id` the
   * analytics events and `@for` keys are built on, so switching the public
   * URLs over to slugs did not quietly change what gets reported.
   */
  routeParam: string;
  name: string;
  breed: string;
  color: string;
  /**
   * The breed and the colour as one line, joined here rather than in the
   * template: `/families` embeds a parent with only some of its dictionary
   * references joined in, so either half can be missing and the separator
   * cannot be hard-coded between them.
   */
  meta: string;
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
  /**
   * The segment this record's page lives at: its slug, or its `_id` while the
   * backend has not minted one. Separate from `id`, which stays the `_id` the
   * analytics events and `@for` keys are built on, so switching the public
   * URLs over to slugs did not quietly change what gets reported.
   */
  routeParam: string;
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
    StatusPillComponent,
    CardGalleryComponent,
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
  /** True when the slug in the URL names no breed at all, which is a 404. */
  protected readonly breedMissing = signal(false);

  /**
   * The permanent breed behind this slug, when there is one.
   *
   * These three URLs are pages whether or not the backend is currently serving
   * the breed: the cattery breeds them permanently, so the address has to be
   * permanent too. When the API cannot serve the breed the page falls back to
   * this record for its name and its copy, instead of reading as a 404 and
   * taking its search ranking with it.
   */
  protected readonly canonical = computed(() => canonicalBreed(this.breedSlugParam()));

  /** True on `/breeds/:slug` whenever that slug does name a breed. */
  protected readonly isBreedPage = computed(
    () => this.breedSlugParam() !== null && (this.activeBreed() !== null || this.canonical() !== null),
  );

  protected readonly activeBreedName = computed(() => {
    const served = this.activeBreed();
    if (served) {
      return taxonomyName(served, this.i18n, this.i18n.t('fallbackNoBreed'));
    }

    const permanent = this.canonical();
    return permanent ? permanent.name[this.i18n.getLanguage()] : this.i18n.t('fallbackNoBreed');
  });

  /**
   * The cattery's own words about this breed, shown on a permanent breed page.
   * It is what the page holds when the catalogue has no kitten of the breed to
   * show, so it is rendered whether or not the listing below it is empty.
   */
  protected readonly breedIntro = computed(() => {
    const permanent = this.canonical();
    return permanent ? permanent.intro[this.i18n.getLanguage()] : null;
  });

  protected readonly activeTab = computed<Tab>(() => {
    const params = this.queryParams();
    return params?.get('tab') === 'parents' ? 'parents' : 'kittens';
  });

  /**
   * Turns the filter toolbar off.
   *
   * The breed picker is the way into the catalogue now: a visitor lands on
   * every kitten and narrows by breed, which is a page of its own rather than
   * a control. The mother/father/sex/breed/colour selects sat beside that
   * doing the same job twice, so they are out of the page.
   *
   * The state and the filtering they drive are left in place behind this one
   * flag: every filter reads `'all'` while it is false, so the panel comes
   * back by flipping it rather than by being written again.
   */
  protected readonly filtersEnabled = false;

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
  private readonly mappedKittens = computed<KittenListItem[]>(() =>
    this.rawKittens().map((kitten) => ({
      ...mapKittenToListItem(kitten, this.i18n),
      age: formatAgeShort(kitten.birthDay, this.i18n) ?? this.i18n.t('fallbackNoAge'),
    })),
  );

  protected readonly parents = signal<ParentApiItem[]>([]);
  protected readonly families = signal<FamilyApiItem[]>([]);

  /**
   * The litters in display order, and the place of every kitten inside its
   * own. Built from the families listing and the kittens together, so a litter
   * the listing could not deliver is still a litter the page shows.
   */
  private readonly familyOrder = computed(() =>
    buildFamilyOrder(this.families(), this.mappedKittens()),
  );

  /**
   * Every kitten, in the one order the whole page agrees on: by the litter's
   * `displayOrder`, then by the kitten's position inside that litter. The flat
   * list and the grouped view are this same sequence, cut differently — and
   * `/kittens` and a breed page order their cards the same way, because a
   * breed page is this list with the other breeds left out.
   */
  protected readonly kittens = computed<KittenListItem[]>(() => {
    const order = this.familyOrder();
    return [...this.mappedKittens()].sort((a, b) => order.compareKittens(a, b));
  });
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

  /**
   * Options carry the breed's slug, the same key `/breeds/:slug` is addressed
   * by, so a breed is identified one way across the whole app. A breed the
   * backend has not minted a slug for yet falls back to its `_id`, which the
   * API also accepts, rather than dropping out of the filter.
   */
  protected readonly breedOptions = computed<SelectOption[]>(() => [
    { value: 'all', label: this.i18n.t('allBreeds') },
    ...this.breeds().map((breed) => ({
      value: breedSlug(breed) ?? breed._id,
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
      // Matched on the slug, not on the name: the same breed is spelled
      // differently in each language, while the slug is one value the whole
      // app agrees on. `breedKey` keeps an id working for a breed that has no
      // slug yet, so both forms resolve against the same option values.
      if (breed !== 'all' && k.breedKey !== breed) return false;
      if (color !== 'all' && k.colorId !== color) return false;
      return true;
    });
  });

  protected readonly groupedByParents = computed<LitterView[]>(() => {
    const order = this.familyOrder();
    // Already in litter order, and in litter order inside each litter, so the
    // cards keep that order by being filtered rather than sorted again.
    const filtered = this.filteredKittens();

    return order.familyIds
      .map((familyId) => {
        const family = order.family(familyId);
        /**
         * Membership comes from the ordering, which reads the kitten's own
         * `familyId` first and a litter's `kittens` list as the fallback —
         * those are the two links the API actually fills in. Matching on the
         * parent pair instead left every litter empty, because
         * `family.parents` used to come back null.
         *
         * It assigns each kitten exactly one litter, so a kitten two litters
         * both claim is shown once and the cards here hold precisely the
         * kittens of the flat list, with the breed and colour filters already
         * applied to them.
         */
        const litterKittens = filtered.filter((k) => order.familyOf(k) === familyId);
        if (litterKittens.length === 0) return null;

        /**
         * The parents come embedded now, which is what spares the grouping a
         * lookup; when only an id arrives it is resolved against the parents
         * listing the page has loaded anyway. A family that names no parents
         * at all still borrows them from its own kittens.
         */
        const mother = this.litterParent(
          family?.parents?.mom,
          litterKittens.find((k) => k.motherId)?.motherId,
        );
        const father = this.litterParent(
          family?.parents?.dad,
          litterKittens.find((k) => k.fatherId)?.fatherId,
        );

        return {
          key: familyId,
          // A family without a name of its own keeps the old parents-based title.
          name:
            family?.name?.trim() ||
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
        // Parents are matched the same way as kittens: slug first, id as the
        // fallback, against the same option the breed select produced.
        (breed === 'all' || (breedSlug(p.breed) ?? taxonomyId(p.breed)) === breed) &&
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
      .pipe(
        // `/filters/breeds` carries the same records, and `breeds` falls back
        // to it, so the picker survives this endpoint being unavailable.
        catchError(() => of<BreedRef[]>([])),
      )
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
      if (!breed && !this.canonical()) {
        return;
      }

      this.seo.applyBreed({
        path: `/breeds/${slug}`,
        name: this.activeBreedName(),
        // A permanent breed page has no cover photo of its own while the
        // backend is not serving the breed; the shared social card stands in.
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
   * Turns a listing request into one that cannot fail the page: on an error it
   * answers with an empty listing. Used for the parents tab, which sits beside
   * the catalogue, never for the kittens themselves.
   */
  private asOptionalSection<T>() {
    return catchError<PaginatedResponse<T>, Observable<PaginatedResponse<T>>>(() =>
      of(emptyPage<T>()),
    );
  }

  /**
   * A litter's mother or father, from whichever of the three sources has it:
   * the record the family embeds, that record looked up by id in the parents
   * listing, or the id a kitten of the litter points at.
   */
  private litterParent(
    member: FamilyMember<ParentApiItem> | null | undefined,
    fallbackId: string | null | undefined,
  ): LitterParentView | null {
    const embedded = familyMemberRecord(member);
    const id = embedded?._id ?? familyMemberId(member) ?? fallbackId ?? null;
    const listed = id ? this.parentMap.get(id) : undefined;

    const base = embedded ?? listed;
    if (!base) {
      return null;
    }

    /**
     * The two sources are merged rather than one picked. `/families` embeds
     * the parent but joins only part of it in — a dad arrives with his colour
     * and no breed at all — while the parents listing carries the whole
     * record. Spreading the embedded one last keeps the litter header working
     * when the listing is unavailable, and the listing fills the gaps the
     * embed leaves, which is what puts the breed back on the card.
     */
    return toLitterParentView({ ...listed, ...embedded, _id: base._id }, this.i18n);
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

    /**
     * `forkJoin` fails as a whole the moment any one of its sources fails, so
     * every request in it has to be one the page genuinely cannot open
     * without. The catalogue needs the kittens, and a breed page needs its
     * breed as well — a 404 there is the page not existing.
     *
     * The parents are not in that class: they feed the parents tab, a section
     * beside the catalogue, so that request is caught and costs only its own
     * tab. The litters are fetched by a loader that already survives a
     * backend that cannot serve them whole.
     */
    /**
     * The litters are always read whole, on a breed page too rather than
     * through the breed-scoped endpoint: the grouping keeps only the litters
     * whose kittens are on the page anyway, `displayOrder` is numbered across
     * the whole cattery rather than per breed, and one source is what makes a
     * breed page and the catalogue order their litters identically.
     */
    const families = this.familiesService
      .getAllFamilies()
      .pipe(catchError(() => of<FamilyApiItem[]>([])));

    const request = slug
      ? forkJoin({
          breed: this.breedsService.getBreed(slug).pipe(map((response) => response.breed)),
          kittens: this.breedsService.getBreedKittens(slug, { perPage: LOOKUP_PER_PAGE }),
          parents: this.breedsService
            .getBreedParents(slug, { perPage: LOOKUP_PER_PAGE })
            .pipe(this.asOptionalSection<ParentApiItem>()),
          families,
        })
      : forkJoin({
          breed: of<BreedRef | null>(null),
          kittens: this.kittensService.getKittens({ perPage: LOOKUP_PER_PAGE }),
          parents: this.parentsService
            .getParents({ perPage: LOOKUP_PER_PAGE })
            .pipe(this.asOptionalSection<ParentApiItem>()),
          families,
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
        this.families.set(families);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        // An unknown slug is a page that does not exist, not a broken API, and
        // it has to read as one: its own copy and `noindex` rather than the
        // generic "could not load" box.
        //
        // A permanent breed is the exception. The backend answering 404 for one
        // of those means it is not serving that breed right now — the page is
        // still a page, so it renders its own copy with an empty listing and
        // stays indexable. Anything the breed endpoint had already put on
        // screen belongs to the previous slug and is cleared.
        if (slug && error instanceof HttpErrorResponse && error.status === 404) {
          if (canonicalBreed(slug)) {
            this.rawKittens.set([]);
            this.parents.set([]);
            this.families.set([]);
            this.parentMap.clear();
          } else {
            this.breedMissing.set(true);
          }
        } else {
          this.loadError.set(this.i18n.t('error'));
        }
        this.isLoading.set(false);
      },
    });
  }
}

/**
 * A listing that carries nothing, used in place of a request that failed. The
 * pagination block is filled in because the readers treat it as always present.
 */
function emptyPage<T>(): PaginatedResponse<T> {
  return {
    data: [],
    pagination: {
      page: 1,
      perPage: 0,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
}

function toLitterParentView(parent: ParentApiItem, i18n: I18nService): LitterParentView {
  const breed = taxonomyName(parent.breed, i18n);
  const color = taxonomyName(parent.color, i18n);

  return {
    id: parent._id,
    routeParam: catRouteParam(parent),
    name: parent.nameUa || parent.nameEn || '—',
    breed,
    color,
    meta: [breed, color].filter((part) => part).join(' · '),
    image: pickImage(parent.images, PARENT_PLACEHOLDER),
  };
}

function toParentCard(parent: ParentApiItem, i18n: I18nService): ParentDisplayCard {
  return {
    id: parent._id,
    routeParam: catRouteParam(parent),
    name: parent.nameUa || parent.nameEn || '—',
    breed: taxonomyName(parent.breed, i18n),
    color: taxonomyName(parent.color, i18n),
    image: pickImage(parent.images, PARENT_PLACEHOLDER),
  };
}
