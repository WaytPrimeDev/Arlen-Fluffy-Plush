import { Pipe, PipeTransform, inject, ChangeDetectorRef, effect } from '@angular/core';
import { I18nService } from '../services/i18n.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private i18n = inject(I18nService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      // Access language to create dependency
      this.i18n.getLanguage();
      this.cdr.markForCheck();
    });
  }

  transform(key: string): string {
    return this.i18n.t(key);
  }
}
