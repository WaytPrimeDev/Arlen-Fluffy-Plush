import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="app-select__trigger"
      [class.app-select__trigger--open]="isOpen()"
      [attr.aria-haspopup]="'listbox'"
      [attr.aria-expanded]="isOpen()"
      [attr.aria-label]="ariaLabel"
      (click)="toggle()"
      (keydown)="onTriggerKey($event)"
    >
      <span class="app-select__value" [class.app-select__value--placeholder]="!selectedLabel()">
        {{ selectedLabel() || placeholder || '—' }}
      </span>
      <svg
        class="app-select__chevron"
        [class.app-select__chevron--open]="isOpen()"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    @if (isOpen()) {
      <div
        class="app-select__panel"
        role="listbox"
        [attr.aria-label]="ariaLabel"
        #panel
      >
        @for (opt of options; track opt.value; let i = $index) {
          <button
            type="button"
            class="app-select__option"
            [class.app-select__option--selected]="opt.value === value"
            [class.app-select__option--focused]="focusedIndex() === i"
            role="option"
            [attr.aria-selected]="opt.value === value"
            (click)="select(opt.value)"
            (mouseenter)="focusedIndex.set(i)"
          >
            @if (opt.value === value) {
              <svg
                class="app-select__check"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
            <span class="app-select__option-label">{{ opt.label }}</span>
          </button>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
        font-family: inherit;
      }

      .app-select__trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.6rem;
        width: 100%;
        padding: 0.65rem 0.9rem;
        border-radius: 12px;
        border: 1px solid rgb(115 86 168 / 22%);
        background: #fff;
        color: var(--text-primary);
        font-size: 0.94rem;
        font-weight: 500;
        line-height: 1.3;
        text-align: left;
        cursor: pointer;
        transition:
          border-color 0.2s ease,
          box-shadow 0.2s ease,
          background-color 0.2s ease,
          transform 0.15s ease;
      }

      .app-select__trigger:hover {
        border-color: rgb(115 86 168 / 45%);
        background-color: #fbf9ff;
        transform: translateY(-1px);
      }

      .app-select__trigger:focus-visible {
        outline: none;
        border-color: var(--brand-purple);
        box-shadow: 0 0 0 3px rgb(115 86 168 / 18%);
      }

      .app-select__trigger--open {
        border-color: var(--brand-purple);
        box-shadow: 0 0 0 3px rgb(115 86 168 / 18%);
        background-color: #fff;
      }

      .app-select__value {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .app-select__value--placeholder {
        color: var(--text-muted);
      }

      .app-select__chevron {
        flex-shrink: 0;
        color: var(--brand-purple);
        transition: transform 0.2s ease;
      }

      .app-select__chevron--open {
        transform: rotate(180deg);
      }

      .app-select__panel {
        position: absolute;
        top: calc(100% + 0.4rem);
        left: 0;
        right: 0;
        z-index: 50;
        max-height: 280px;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 0.35rem;
        border-radius: 14px;
        background: #fff;
        border: 1px solid rgb(115 86 168 / 18%);
        box-shadow:
          0 14px 32px rgb(28 24 39 / 12%),
          0 4px 8px rgb(28 24 39 / 4%);
        display: flex;
        flex-direction: column;
        gap: 2px;
        animation: app-select-pop 0.16s ease-out;
      }

      @keyframes app-select-pop {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .app-select__panel::-webkit-scrollbar {
        width: 8px;
      }
      .app-select__panel::-webkit-scrollbar-thumb {
        background: rgb(115 86 168 / 25%);
        border-radius: 999px;
      }
      .app-select__panel::-webkit-scrollbar-thumb:hover {
        background: rgb(115 86 168 / 45%);
      }
      .app-select__panel::-webkit-scrollbar-track {
        background: transparent;
      }

      .app-select__option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.55rem 0.75rem;
        border: none;
        background: transparent;
        color: var(--text-primary);
        font-size: 0.92rem;
        font-weight: 500;
        text-align: left;
        cursor: pointer;
        border-radius: 10px;
        transition: background-color 0.15s ease, color 0.15s ease;
      }

      .app-select__option:hover,
      .app-select__option--focused {
        background: var(--brand-light);
        color: var(--brand-purple);
      }

      .app-select__option--selected {
        background: rgb(115 86 168 / 14%);
        color: var(--brand-purple);
        font-weight: 600;
      }

      .app-select__option--selected:hover,
      .app-select__option--selected.app-select__option--focused {
        background: rgb(115 86 168 / 20%);
      }

      .app-select__option:focus-visible {
        outline: none;
      }

      .app-select__check {
        flex-shrink: 0;
        color: var(--brand-purple);
      }

      .app-select__option-label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ],
})
export class SelectComponent {
  @Input() options: SelectOption[] = [];
  @Input() value: string = '';
  @Input() ariaLabel: string = '';
  @Input() placeholder: string = '';
  @Output() valueChange = new EventEmitter<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  @ViewChild('panel') private panelRef?: ElementRef<HTMLDivElement>;

  protected readonly isOpen = signal(false);
  protected readonly focusedIndex = signal(-1);

  protected readonly selectedLabel = computed(() => {
    const match = this.options.find((o) => o.value === this.value);
    return match?.label ?? '';
  });

  protected toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  protected open(): void {
    this.isOpen.set(true);
    const idx = this.options.findIndex((o) => o.value === this.value);
    this.focusedIndex.set(idx >= 0 ? idx : 0);
  }

  protected close(): void {
    this.isOpen.set(false);
    this.focusedIndex.set(-1);
  }

  protected select(value: string): void {
    if (value !== this.value) {
      this.valueChange.emit(value);
    }
    this.close();
  }

  protected onTriggerKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!this.isOpen()) this.open();
      else this.moveFocus(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.isOpen()) this.open();
      else this.moveFocus(-1);
    } else if (event.key === 'Escape') {
      if (this.isOpen()) this.close();
    }
  }

  @HostListener('keydown', ['$event'])
  onHostKey(event: KeyboardEvent): void {
    if (!this.isOpen()) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveFocus(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveFocus(-1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const idx = this.focusedIndex();
      if (idx >= 0 && idx < this.options.length) {
        this.select(this.options[idx].value);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.focusedIndex.set(0);
      this.scrollFocusedIntoView();
    } else if (event.key === 'End') {
      event.preventDefault();
      this.focusedIndex.set(this.options.length - 1);
      this.scrollFocusedIntoView();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  private moveFocus(delta: number): void {
    if (!this.options.length) return;
    const len = this.options.length;
    const current = this.focusedIndex();
    const next = current < 0 ? 0 : (current + delta + len) % len;
    this.focusedIndex.set(next);
    this.scrollFocusedIntoView();
  }

  private scrollFocusedIntoView(): void {
    queueMicrotask(() => {
      const panel = this.panelRef?.nativeElement;
      if (!panel) return;
      const el = panel.children[this.focusedIndex()] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    });
  }
}
