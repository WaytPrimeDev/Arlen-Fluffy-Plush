import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import type { KittenStatus } from '../../services/kitten-view.util';

/** The three states that are a step in the sale, and the word for each. */
const LABEL_KEYS = {
  available: 'available',
  reserved: 'reserved',
  sold: 'sold',
} as const;

/**
 * The translation key for a state, or null for one the site does not label.
 *
 * Exported because the pill is not the only place a state has to be said: a
 * card that carries its own `aria-label` replaces the text inside it, so the
 * label has to name the state itself or a screen reader never hears it. Both
 * readers go through this, so the pill and the label cannot drift apart.
 */
export function statusLabelKey(status: KittenStatus): string | null {
  return LABEL_KEYS[status as keyof typeof LABEL_KEYS] ?? null;
}

/**
 * Where a kitten stands in the sale, as a tinted pill: green while it is on
 * offer, amber once it is reserved, red once it has left.
 *
 * `offline` is the cattery's "hidden" flag rather than a step in the sale, so
 * it draws nothing at all. A kitten whose status nobody has set says nothing
 * about availability rather than guessing a colour for it.
 *
 * The tint is never the only carrier: every pill is labelled, so the states
 * are told apart without seeing colour at all. Each tint is paired with ink
 * from its own hue at 6:1 or better against it — comfortably past the 4.5:1 AA
 * minimum for the small type the pill is set in.
 */
@Component({
  selector: 'app-status-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label(); as text) {
      <span
        class="status-pill"
        [class.status-pill--available]="status() === 'available'"
        [class.status-pill--reserved]="status() === 'reserved'"
        [class.status-pill--sold]="status() === 'sold'"
        [class.status-pill--overlay]="variant() === 'overlay'"
        >{{ text }}</span
      >
    }
  `,
  styles: `
    /* The pill is the element the host has to place, so the host steps out of
       the way and lets it be the flex item of whatever row it sits in. */
    :host {
      display: contents;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.38rem;
      padding: 0.18rem 0.6rem 0.18rem 0.5rem;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 600;
      white-space: nowrap;
    }

    /* A dot in a deeper shade of the pill's own hue, so the state reads as a
       status light before the word is read. Generated content rather than an
       element: it is pure decoration — the label beside it is what carries the
       meaning — and this way no screen reader has anything to announce. */
    .status-pill::before {
      content: '';
      flex: none;
      width: 0.44rem;
      height: 0.44rem;
      border-radius: 50%;
      background: var(--status-pill-dot);
    }

    .status-pill--available {
      --status-pill-dot: #15803d;

      background: #dcfce7;
      color: #166534;
    }

    .status-pill--reserved {
      --status-pill-dot: #b45309;

      background: #fef3c7;
      color: #854d0e;
    }

    .status-pill--sold {
      --status-pill-dot: #b91c1c;

      background: #fee2e2;
      color: #991b1b;
    }

    /* Over a photo the tints alone can sink into a pale background, so the
       pill is lifted the same way the age badge beside it is. */
    .status-pill--overlay {
      box-shadow: 0 2px 8px rgb(28 24 39 / 20%);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }
  `,
})
export class StatusPillComponent {
  private readonly i18n = inject(I18nService);

  readonly status = input.required<KittenStatus>();

  /** `overlay` is the pill laid over a photo, which needs lifting off it. */
  readonly variant = input<'flat' | 'overlay'>('flat');

  /** The word for the state, or null for one the site does not label. */
  protected readonly label = computed(() => {
    const key = statusLabelKey(this.status());
    return key ? this.i18n.t(key) : null;
  });
}
