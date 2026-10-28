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
import { RouterLink } from '@angular/router';
import { ParentsService, type ParentApiItem } from './parents.service';
import { I18nService } from '../../services/i18n.service';
import { FiltersService, type Pagination } from '../../services/filters.service';
import { CommonModule } from '@angular/common';
import { LocalizedPathPipe } from '../../pipes/localized-path.pipe';
import { localizedName, PARENT_PLACEHOLDER } from '../../services/kitten-view.util';
import { ImageFallbackDirective } from '../../components/image-fallback/image-fallback.directive';

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

const PER_PAGE = 12;

@Component({
  selector: 'app-parents',
  imports: [RouterLink, CommonModule, LocalizedPathPipe, ImageFallbackDirective],
  templateUrl: './parents.component.html',
  styleUrl: './parents.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.escape)': 'closeFilters()' },
})
export class ParentsComponent {
  private readonly parentsService = inject(ParentsService);
  private readonly filtersService = inject(FiltersService);
  protected readonly i18n = inject(I18nService);

  /** Stand-in for a grown cat whose photo is missing, read by the template. */
  protected readonly parentPlaceholder = PARENT_PLACEHOLDER;

  protected readonly sexOptions = computed<SexOption[]>(() => [
    { value: 'all', label: this.i18n.t('all') },
    { value: 'female', label: this.i18n.t('female') },
    { value: 'male', label: this.i18n.t('male') },
  ]);

  protected readonly activeSex = signal<SexFilter>('all');
  /** All filters live behind the one button, so the panel starts closed. */
  protected readonly filtersOpen = signal(false);

  private readonly filtersToggle = viewChild<ElementRef<HTMLButtonElement>>('filtersToggle');
  protected readonly activeBreed = signal<string>('all');
  protected readonly activeColor = signal<string>('all');

  protected readonly breeds = this.filtersService.breeds;
  protected readonly colors = this.filtersService.colors;

  private readonly rawParents = signal<readonly ParentApiItem[]>([]);

  /**
   * Mapped in a `computed` rather than on arrival, so names and fallbacks
   * follow the language the visitor switches to.
   */
  protected readonly parents = computed<ParentListItem[]>(() =>
    this.rawParents().map((parent) => mapParentToListItem(parent, this.i18n)),
  );
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
      const color = this.activeColor();
      untracked(() => this.reload(breed, color));
    });
  }

  protected readonly activeFilterCount = computed(
    () =>
      [this.activeSex(), this.activeBreed(), this.activeColor()].filter((value) => value !== 'all')
        .length,
  );

  protected setSex(sex: SexFilter): void {
    this.activeSex.set(sex);
  }

  protected toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }

  protected resetFilters(): void {
    this.activeSex.set('all');
    this.activeBreed.set('all');
    this.activeColor.set('all');
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

  protected setBreed(breed: string): void {
    this.activeBreed.set(breed);
  }

  protected setColor(color: string): void {
    this.activeColor.set(color);
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

  private reload(breed: string, color: string): void {
    this.page.set(1);
    this.rawParents.set([]);
    this.pagination.set(null);
    this.fetch(breed, color);
  }

  private fetch(breed = this.activeBreed(), color = this.activeColor()): void {
    this.isLoading.set(true);
    this.loadError.set('');
    this.parentsService
      .getParents({
        page: this.page(),
        perPage: PER_PAGE,
        breed: breed === 'all' ? undefined : breed,
        color: color === 'all' ? undefined : color,
      })
      .subscribe({
        next: (response) => {
          const batch = response.data ?? [];
          this.rawParents.update((prev) => (this.page() === 1 ? batch : [...prev, ...batch]));
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

function mapParentToListItem(parent: ParentApiItem, i18n: I18nService): ParentListItem {
  return {
    id: parent._id,
    name: localizedName(parent.nameUa, parent.nameEn, i18n),
    breed: parent.breed || i18n.t('fallbackNoBreed'),
    color: parent.color || i18n.t('fallbackNoColor'),
    sex: parent.sex === 'male' ? 'male' : parent.sex === 'female' ? 'female' : 'unknown',
    kittensCount: parent.Kittens?.length ?? 0,
    image:
      parent.images?.find((img) => img.isMain)?.full ??
      parent.images?.[0]?.full ??
      PARENT_PLACEHOLDER,
  };
}
