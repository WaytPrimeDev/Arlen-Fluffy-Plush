import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { RouterLink } from '@angular/router';
import { FamiliesService, type FamilyBreed } from './families.service';
import { I18nService } from '../../services/i18n.service';

type TabType = 'breeds' | 'families' | 'kittens';

interface LoadState {
  breeds: FamilyBreed[];
  error: string;
  loaded: boolean;
}

@Component({
  selector: 'app-families',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './families.component.html',
  styleUrl: './families.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamiliesComponent {
  private readonly familiesService = inject(FamiliesService);
  protected readonly i18n = inject(I18nService);

  protected readonly activeTab = signal<TabType>('breeds');

  private readonly loadState = toSignal(
    this.familiesService.getBreeds().pipe(
      map((breeds) => ({ breeds, error: '', loaded: true })),
      catchError(() =>
        of({
          breeds: [],
          error: this.i18n.t('error'),
          loaded: true,
        }),
      ),
    ),
    { initialValue: { breeds: [], error: '', loaded: false } },
  );

  protected readonly breeds = computed(() => this.loadState().breeds);
  protected readonly isLoading = computed(() => !this.loadState().loaded);
  protected readonly error = computed(() => this.loadState().error);

  protected tabOptions = computed<{ value: TabType; label: string }[]>(() => [
    { value: 'breeds', label: 'Породы' },
    { value: 'families', label: 'Семьи' },
    { value: 'kittens', label: 'Котята' },
  ]);

  protected setTab(tab: TabType): void {
    this.activeTab.set(tab);
  }
}
