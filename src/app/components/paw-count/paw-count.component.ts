import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A count badge shaped like a cat's paw print: four toe beans above a main pad
 * that carries the number. The paw is drawn with `currentColor`, so a host only
 * needs to set `color` (and `--paw-count-size` / `--paw-count-ink` to taste).
 */
@Component({
  selector: 'app-paw-count',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'paw-count',
    '[class.paw-count--solid]': "variant() === 'solid'",
  },
  template: `
    <svg class="paw-count__shape" viewBox="0 0 44 42" aria-hidden="true" focusable="false">
      <ellipse cx="6.6" cy="17" rx="4.5" ry="5.9" transform="rotate(-22 6.6 17)" />
      <ellipse cx="15.6" cy="8.6" rx="4.7" ry="6.3" transform="rotate(-10 15.6 8.6)" />
      <ellipse cx="28.4" cy="8.6" rx="4.7" ry="6.3" transform="rotate(10 28.4 8.6)" />
      <ellipse cx="37.4" cy="17" rx="4.5" ry="5.9" transform="rotate(22 37.4 17)" />
      <path d="M22 17.6c7.3 0 14 5.3 14 12.6 0 6.5-5.3 10.8-14 10.8S8 36.7 8 30.2c0-7.3 6.7-12.6 14-12.6z" />
    </svg>
    <span class="paw-count__value">{{ count() }}</span>
  `,
  styles: `
    :host {
      position: relative;
      display: inline-block;
      width: var(--paw-count-size, 38px);
      height: calc(var(--paw-count-size, 38px) * 0.955);
      flex: none;
      line-height: 1;
    }

    .paw-count__shape {
      display: block;
      width: 100%;
      height: 100%;
      fill: currentColor;
      fill-opacity: 0.18;
    }

    :host(.paw-count--solid) .paw-count__shape {
      fill-opacity: 1;
    }

    .paw-count__value {
      position: absolute;
      left: 50%;
      top: 71%;
      transform: translate(-50%, -50%);
      font-family: Inter, sans-serif;
      font-size: calc(var(--paw-count-size, 38px) * 0.3);
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--paw-count-ink, currentColor);
    }
  `,
})
export class PawCountComponent {
  readonly count = input.required<number>();
  /** `soft` tints the paw and inks the number in the same color; `solid` fills it. */
  readonly variant = input<'soft' | 'solid'>('soft');
}
