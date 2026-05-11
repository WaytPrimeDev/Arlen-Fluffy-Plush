import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { ParentsService, type ParentApiItem } from './parents.service';

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

interface LoadState {
  parents: ParentListItem[];
  error: string;
  loaded: boolean;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1518288774672-b94e808873ff?auto=format&fit=crop&w=800&q=80';

@Component({
  selector: 'app-parents',
  imports: [RouterLink],
  templateUrl: './parents.component.html',
  styleUrl: './parents.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentsComponent {
  private readonly parentsService = inject(ParentsService);

  protected readonly sexOptions: SexOption[] = [
    { value: 'all', label: 'Все' },
    { value: 'female', label: 'Кошки' },
    { value: 'male', label: 'Коты' },
  ];

  protected readonly activeSex = signal<SexFilter>('all');

  private readonly loadState = toSignal(
    this.parentsService.getParents().pipe(
      map(
        (parents): LoadState => ({
          parents: parents.map(mapParentToListItem),
          error: '',
          loaded: true,
        }),
      ),
      catchError(() =>
        of<LoadState>({
          parents: [],
          error: 'Не удалось загрузить список родителей. Попробуйте обновить страницу.',
          loaded: true,
        }),
      ),
    ),
    { initialValue: { parents: [], error: '', loaded: false } satisfies LoadState },
  );

  protected readonly isLoading = computed(() => !this.loadState().loaded);
  protected readonly loadError = computed(() => this.loadState().error);
  protected readonly parents = computed(() => this.loadState().parents);

  protected readonly filteredParents = computed(() => {
    const sex = this.activeSex();
    const list = this.parents();
    return sex === 'all' ? list : list.filter((p) => p.sex === sex);
  });

  protected setSex(sex: SexFilter): void {
    this.activeSex.set(sex);
  }

  protected formatSex(sex: ParentListItem['sex']): string {
    if (sex === 'female') return 'Кошка';
    if (sex === 'male') return 'Кот';
    return 'Не указан';
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
