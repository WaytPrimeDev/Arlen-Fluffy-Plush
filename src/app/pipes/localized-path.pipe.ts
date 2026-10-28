import { ChangeDetectorRef, Pipe, PipeTransform, effect, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';

/**
 * Prefixes an app path with the active language, so templates can keep writing
 * the path once: `'/kittens' | locPath` becomes `/uk/kittens`, and
 * `['/parents', id] | locPath` becomes `/uk/parents/<id>`.
 *
 * Impure, like `TranslatePipe`: the header and footer are not rebuilt when the
 * language changes, so their links have to be recomputed in place.
 */
@Pipe({
  name: 'locPath',
  pure: false,
})
export class LocalizedPathPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      this.i18n.getLanguage();
      this.cdr.markForCheck();
    });
  }

  transform(path: string | readonly unknown[]): unknown[] {
    const parts = Array.isArray(path) ? path : [path];
    const [first, ...rest] = parts;
    const head = String(first ?? '')
      .split('/')
      .filter(Boolean);

    return ['/', this.i18n.getLanguage(), ...head, ...rest];
  }
}
