export interface AgeLabels {
  /** Short label for "months" (e.g. "міс." / "mo"). */
  mo: string;
  /** Short label for "days" (e.g. "дн." / "d"). */
  d: string;
}

const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30.4375;

/**
 * Format a kitten's age from its birth date as months + days, e.g.
 * "3 міс. 14 дн." / "3 mo 14 d". Returns null for missing/invalid dates.
 * Labels are passed in so this utility stays free of i18n dependencies.
 */
export function formatAge(
  birthDay: string | undefined | null,
  labels: AgeLabels,
  now?: Date,
): string | null {
  if (!birthDay) return null;
  const birth = new Date(birthDay);
  if (Number.isNaN(birth.getTime())) return null;

  const reference = now ?? new Date();
  const totalDays = Math.max(0, Math.floor((reference.getTime() - birth.getTime()) / MS_PER_DAY));
  const months = Math.floor(totalDays / DAYS_PER_MONTH);
  const days = Math.min(Math.max(totalDays - Math.round(months * DAYS_PER_MONTH), 0), 30);

  if (months > 0 && days > 0) return `${months} ${labels.mo} ${days} ${labels.d}`;
  if (months > 0) return `${months} ${labels.mo}`;
  return `${days} ${labels.d}`;
}
