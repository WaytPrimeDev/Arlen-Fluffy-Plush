import type { I18nService } from './i18n.service';

/**
 * The three URLs the API hands out for a breed's cover photo: `thumbnail` is a
 * 400×400 `c_fill` crop, `mobile` an 800×800 one, and `full` the photo at its
 * own proportions.
 */
export interface TaxonomyImage {
  full: string;
  thumbnail?: string;
  mobile?: string;
}

/**
 * A reference to a dictionary entry, as the API now embeds it. Breeds and
 * colours used to arrive as bare strings; they are objects with their own `_id`
 * since the filters moved to ids, and the name comes pre-joined so nothing has
 * to be looked up against `/filters/*`.
 *
 * `nameLang3` and `nameLang4` are reserved for languages the site does not
 * publish yet and are always null today — read through `taxonomyName`, which
 * only ever shows a non-empty value.
 */
export interface TaxonomyRef {
  _id: string;
  nameUa?: string | null;
  nameEn?: string | null;
  nameLang3?: string | null;
  nameLang4?: string | null;
}

/** A colour carries nothing beyond the shared fields. */
export type ColorRef = TaxonomyRef;

export interface BreedRef extends TaxonomyRef {
  /** Second key, minted by the backend; what the public breed URLs use. */
  slug?: string | null;
  /** Mandatory on the admin side, so a breed card always has a cover photo. */
  image?: TaxonomyImage | null;
}

/**
 * The reference can be missing entirely: deleting a dictionary entry from under
 * a kitten leaves `breed: null`, and an older backend still answers with a bare
 * string. Both are handled here so no caller has to.
 */
export type MaybeRef<T extends TaxonomyRef> = T | string | null | undefined;

/** Normalizes a value that may still be a plain name into a reference. */
export function toRef<T extends TaxonomyRef>(value: MaybeRef<T>): T | null {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    // A legacy string carries a name and nothing else; it doubles as the id so
    // a filter built from it still produces a stable, if unusable, value.
    return { _id: value, nameUa: value, nameEn: value } as T;
  }
  return value;
}

/**
 * The name in the language of the page, falling back to the other one and then
 * to whichever reserved translation is filled in, so a card never renders the
 * word "null".
 */
export function taxonomyName(
  value: MaybeRef<TaxonomyRef>,
  i18n: I18nService,
  fallback = '',
): string {
  const ref = toRef(value);
  if (!ref) {
    return fallback;
  }

  const preferred = i18n.getLanguage() === 'uk' ? ref.nameUa : ref.nameEn;
  const candidates = [preferred, ref.nameUa, ref.nameEn, ref.nameLang3, ref.nameLang4];
  return candidates.find((name) => name?.trim())?.trim() || fallback;
}

/** The id a filter has to send; `null` when there is no reference to send. */
export function taxonomyId(value: MaybeRef<TaxonomyRef>): string | null {
  return toRef(value)?._id ?? null;
}

/** The breed's public URL segment, or null for a breed without one yet. */
export function breedSlug(value: MaybeRef<BreedRef>): string | null {
  return toRef<BreedRef>(value)?.slug?.trim() || null;
}

/**
 * The widest version of a breed's cover photo. `full` keeps the photo's own
 * proportions, which is what the tiles crop themselves with CSS; the square
 * `mobile`/`thumbnail` crops are the fallback when it is missing.
 */
export function breedCover(value: MaybeRef<BreedRef>): string | null {
  const image = toRef<BreedRef>(value)?.image;
  return image?.full || image?.mobile || image?.thumbnail || null;
}
