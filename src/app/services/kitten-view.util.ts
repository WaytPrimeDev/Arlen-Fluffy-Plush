import type { KittenApiItem } from '../pages/kittens/kittens.service';
import type { I18nService } from './i18n.service';

export type KittenStatus = 'available' | 'reserved' | 'offline';

export interface KittenListItem {
  id: string;
  name: string;
  breed: string;
  age: string;
  color: string;
  status: KittenStatus;
  /** Ready-made one-line label, used where there is no room for both prices. */
  priceLabel: string;
  /** The two prices on their own, so a card can label each of them. */
  prices: { pet: string | null; breeding: string | null };
  image: string;
  gender: 'male' | 'female' | 'unknown';
  motherId: string | null;
  fatherId: string | null;
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

/**
 * The fallbacks below are translated rather than hard-coded, so a card with
 * missing data still speaks the language of the page it is rendered on.
 */
export function mapKittenToListItem(kitten: KittenApiItem, i18n: I18nService): KittenListItem {
  return {
    id: kitten._id,
    name: localizedName(kitten.nameUa, kitten.nameEn, i18n),
    breed: kitten.breed || i18n.t('fallbackNoBreed'),
    age: formatBirthDay(kitten.birthDay, i18n),
    color: kitten.color || i18n.t('fallbackNoColor'),
    status: mapStatus(kitten.status),
    priceLabel: formatPrice(kitten, i18n),
    prices: {
      pet: kitten.price?.pet?.trim() || null,
      breeding: kitten.price?.breeding?.trim() || null,
    },
    image: pickImage(kitten.images),
    gender: kitten.sex === 'male' || kitten.sex === 'female' ? kitten.sex : 'unknown',
    motherId: kitten.parentId?.mom ?? null,
    fatherId: kitten.parentId?.dad ?? null,
  };
}

export function mapStatus(status?: string): KittenStatus {
  if (status === 'reserved') return 'reserved';
  if (status === 'offline' || status === 'sold') return 'offline';
  return 'available';
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
  const pet = kitten.price?.pet;
  const breeding = kitten.price?.breeding;
  if (pet || breeding) {
    const parts: string[] = [];
    if (pet) parts.push(`${i18n.t('petPrice')}: ${pet}`);
    if (breeding) parts.push(`${i18n.t('breedingPrice')}: ${breeding}`);
    return parts.join(' | ');
  }
  return i18n.t('priceOnRequest');
}
