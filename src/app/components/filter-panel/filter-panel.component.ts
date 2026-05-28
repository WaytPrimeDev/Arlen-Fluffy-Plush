import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { SelectComponent, type SelectOption } from '../select/select.component';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface FilterConfig {
  key: string;
  label: string;
  options: SelectOption[];
  value: string;
}

export interface FilterChange {
  key: string;
  value: string;
}

interface ChipView {
  key: string;
  label: string;
  valueLabel: string;
}

@Component({
  selector: 'app-filter-panel',
  imports: [SelectComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
})
export class FilterPanelComponent {
  readonly filters = input.required<FilterConfig[]>();
  readonly triggerLabel = input<string>('');

  readonly filterChange = output<FilterChange>();
  readonly resetAll = output<void>();

  protected readonly i18n = inject(I18nService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly isOpen = signal(false);

  protected readonly activeChips = computed<ChipView[]>(() =>
    this.filters()
      .filter((f) => f.value !== 'all')
      .map((f) => ({
        key: f.key,
        label: f.label,
        valueLabel: f.options.find((o) => o.value === f.value)?.label ?? f.value,
      })),
  );

  protected readonly activeCount = computed(() => this.activeChips().length);

  protected toggle(): void {
    this.isOpen.update((v) => !v);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected onSelect(key: string, value: string): void {
    this.filterChange.emit({ key, value });
  }

  protected removeChip(key: string): void {
    this.filterChange.emit({ key, value: 'all' });
  }

  protected onResetAll(): void {
    this.resetAll.emit();
    this.close();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
