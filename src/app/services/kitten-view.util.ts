import type { KittenApiItem } from '../pages/kittens/kittens.service';
import { catRouteParam } from './cat-route.util';
import type { I18nService } from './i18n.service';
import { breedSlug, taxonomyId, taxonomyName } from './taxonomy';

/**
 * Where a kitten stands in the sale. These are the site's own four states; the
 * admin stores them as `active | booked | out | offline`, which `mapStatus`
 * translates. `offline` is the cattery's "hidden" flag rather than a step in
 * the sale, so nothing claims availability for it.
 */
export type KittenStatus = 'available' | 'reserved' | 'sold' | 'offline';

export interface KittenListItem {
  id: string;
  /**
   * The segment this record's page lives at: its slug, or its `_id` while the
   * backend has not minted one. Separate from `id`, which stays the `_id` the
   * analytics events and `@for` keys are built on, so switching the public
   * URLs over to slugs did not quietly change what gets reported.
   */
  routeParam: string;
  name: string;
  breed: string;
  /** The breed's id and slug, for filtering by id and linking to its page. */
  /**
   * How a breed is identified across the app: its slug, falling back to its
   * `_id` for a breed the backend has not minted one for. One field rather
   * than a slug and an id side by side — the filter options are built from the
   * same expression, so a card and an option can only ever agree.
   */
  breedKey: string | null;
  age: string;
  color: string;
  colorId: string | null;
  status: KittenStatus;
  /** Ready-made one-line label, used where there is no room for both prices. */
  priceLabel: string;
  /** The two prices on their own, so a card can label each of them. */
  prices: { pet: string | null; breeding: string | null };
  image: string;
  /**
   * The first few photos of the animal, main one first, for the small gallery
   * on a card. Never empty: a record with no usable photo gets the stand-in,
   * so a card always has exactly one slide to show.
   */
  images: string[];
  gender: 'male' | 'female' | 'unknown';
  motherId: string | null;
  fatherId: string | null;
  /** Which litter the kitten belongs to, used to group the cards by family. */
  familyId: string | null;
}

/** Shape shared by `KittenImage` and `ParentImage`. */
interface PickableImage {
  full: string;
  isMain?: boolean;
}

/**
 * Stand-ins for an animal whose photo is missing: the API has none yet, or the
 * one it gave us fails to load. They are shipped with the site rather than
 * fetched from a stock service, so a card never waits on a third party, and
 * they are split by animal so a kitten card never shows a grown cat.
 */
export const KITTEN_PLACEHOLDER = '/assets/img/kitten.webp';
export const PARENT_PLACEHOLDER = '/assets/img/parent.webp';

export function pickImage(
  images: readonly PickableImage[] | undefined,
  fallback: string = KITTEN_PLACEHOLDER,
): string {
  if (!images || images.length === 0) return fallback;
  return images.find((i) => i.isMain)?.full ?? images[0].full ?? fallback;
}

/** How many photos a card's gallery lets a visitor flip through. */
export const CARD_GALLERY_LIMIT = 3;

/**
 * The photos a card shows, in the order it shows them: the main one first,
 * then the rest as the API ordered them, cut to `CARD_GALLERY_LIMIT`.
 *
 * Entries without a usable URL are dropped rather than rendered as a broken
 * slide, and a record left with none falls back to the stand-in — so the first
 * entry always matches what `pickImage` would have picked on its own.
 */
export function pickImages(
  images: readonly PickableImage[] | undefined,
  fallback: string = KITTEN_PLACEHOLDER,
  limit: number = CARD_GALLERY_LIMIT,
): string[] {
  const usable = (images ?? []).filter((image) => image.full?.trim());
  if (usable.length === 0) return [fallback];

  const mainIndex = usable.findIndex((image) => image.isMain);
  const ordered =
    mainIndex > 0
      ? [usable[mainIndex], ...usable.filter((_, index) => index !== mainIndex)]
      : usable;

  return ordered.slice(0, limit).map((image) => image.full);
}

/**
 * The fallbacks below are translated rather than hard-coded, so a card with
 * missing data still speaks the language of the page it is rendered on.
 */
export function mapKittenToListItem(kitten: KittenApiItem, i18n: I18nService): KittenListItem {
  return {
    id: kitten._id,
    routeParam: catRouteParam(kitten),
    name: localizedName(kitten.nameUa, kitten.nameEn, i18n),
    breed: taxonomyName(kitten.breed, i18n, i18n.t('fallbackNoBreed')),
    breedKey: breedSlug(kitten.breed) ?? taxonomyId(kitten.breed),
    age: formatBirthDay(kitten.birthDay, i18n),
    color: taxonomyName(kitten.color, i18n, i18n.t('fallbackNoColor')),
    colorId: taxonomyId(kitten.color),
    status: mapStatus(kitten.status),
    priceLabel: formatPrice(kitten, i18n),
    prices: {
      pet: withCurrency(kitten.price?.pet),
      breeding: withCurrency(kitten.price?.breeding),
    },
    image: pickImage(kitten.images),
    images: pickImages(kitten.images),
    gender: kitten.sex === 'male' || kitten.sex === 'female' ? kitten.sex : 'unknown',
    motherId: kitten.parentId?.mom ?? null,
    fatherId: kitten.parentId?.dad ?? null,
    familyId: kitten.familyId ?? null,
  };
}

/**
 * The admin's status vocabulary, translated to the site's.
 *
 * It stores exactly `active` ("в продаже"), `booked` ("забронирован"), `out`
 * ("уехал") and `offline` ("скрыт") — see `admin-cat/src/utils/kittenStatus.ts`
 * — and `reserved`/`sold` are kept beside them because older records and the
 * schema.org mapping were written against those words.
 *
 * Anything unrecognized, a missing status included, reads as `offline`: the
 * same thing the admin does with a status it cannot place, and the one answer
 * that does not advertise a kitten the cattery has said nothing about. The
 * fallback used to be `available`, which is what quietly painted every
 * `booked` and `out` kitten as still on offer.
 */
export function mapStatus(status?: string): KittenStatus {
  switch (status?.trim().toLowerCase()) {
    case 'active':
    case 'available':
      return 'available';
    case 'booked':
    case 'reserved':
      return 'reserved';
    case 'out':
    case 'sold':
      return 'sold';
    default:
      return 'offline';
  }
}

/** Picks the name the current language has, falling back to the other one. */
export function localizedName(
  nameUa: string | undefined,
  nameEn: string | undefined,
  i18n: I18nService,
): string {
  const preferred = i18n.getLanguage() === 'uk' ? nameUa : nameEn;
  return preferred?.trim() || nameUa?.trim() || nameEn?.trim() || i18n.t('fallbackNoName');
}

/** The locale whose date format matches the language of the page. */
export function dateLocale(i18n: I18nService): string {
  return i18n.getLanguage() === 'uk' ? 'uk-UA' : 'en-GB';
}

export function formatBirthDay(birthDay: string | undefined, i18n: I18nService): string {
  if (!birthDay) return i18n.t('fallbackNoAge');
  const date = new Date(birthDay);
  if (Number.isNaN(date.getTime())) return i18n.t('fallbackNoAge');
  return date.toLocaleDateString(dateLocale(i18n));
}

/**
 * Compact age for a badge, in the units of the current language.
 * Returns `null` when the birth date is missing or unusable, so the caller
 * decides what to show in its place.
 */
export function formatAgeShort(birthDay: string | undefined, i18n: I18nService): string | null {
  if (!birthDay) return null;
  const date = new Date(birthDay);
  if (Number.isNaN(date.getTime())) return null;

  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return `${diffDays}${i18n.t('ageDaysShort')}`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 8) return `${diffWeeks} ${i18n.t('ageWeeksShort')}`;

  const diffMonths = Math.floor(diffDays / 30.44);
  if (diffMonths < 24) return `${diffMonths} ${i18n.t('ageMonthsShort')}`;

  return `${Math.floor(diffMonths / 12)} ${i18n.t('ageYearsShort')}`;
}

export function formatPrice(kitten: KittenApiItem, i18n: I18nService): string {
  const pet = withCurrency(kitten.price?.pet);
  const breeding = withCurrency(kitten.price?.breeding);
  if (pet || breeding) {
    const parts: string[] = [];
    if (pet) parts.push(`${i18n.t('petPrice')}: ${pet}`);
    if (breeding) parts.push(`${i18n.t('breedingPrice')}: ${breeding}`);
    return parts.join(' | ');
  }
  return i18n.t('priceOnRequest');
}

/**
 * Prices are free text on the admin side, so some already carry a currency
 * ("1200 $", "15000 грн") and some are a bare number. A dollar sign is added
 * only to the bare ones, which keeps a hryvnia or euro price intact instead of
 * relabelling it.
 */
export function withCurrency(value: string | null | undefined): string | null {
  const price = value?.trim();
  if (!price) return null;
  if (/грн|₴|uah|\$|usd|дол|€|eur|євро/i.test(price)) return price;
  return `${price} $`;
}
