import { Directive, ElementRef, inject, input } from '@angular/core';
import { KITTEN_PLACEHOLDER } from '../../services/kitten-view.util';

/**
 * Swaps a photo that fails to load for a stand-in.
 *
 * `pickImage` already covers an animal the API gave no photo for, but a URL it
 * did give can still be dead — a deleted Cloudinary asset, a typo in the
 * record, a visitor behind a filter. Both end in the same broken-image icon
 * next to the animal's name, so both are handled the same way.
 */
@Directive({
  selector: 'img[appImageFallback]',
  host: {
    '(error)': 'onError()',
  },
})
export class ImageFallbackDirective {
  /** The stand-in to show. Pass `PARENT_PLACEHOLDER` on a grown cat. */
  readonly appImageFallback = input(KITTEN_PLACEHOLDER);

  private readonly image = inject<ElementRef<HTMLImageElement>>(ElementRef);

  protected onError(): void {
    const fallback = this.appImageFallback();
    const element = this.image.nativeElement;

    // `src` reads back absolute, so the stand-in is matched by its tail. The
    // comparison is what stops a stand-in that is itself missing from looping.
    if (!fallback || element.src.endsWith(fallback)) {
      return;
    }

    element.src = fallback;
  }
}
