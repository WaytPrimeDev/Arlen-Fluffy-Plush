import type { Language } from './i18n.service';

/**
 * Cyrillic → Latin transliteration map (lowercase).
 * Ukrainian KMU-2010 romanization, extended with the Russian-only letters
 * (ё, ы, э, ъ) so mixed-language source strings transliterate cleanly.
 * Soft/hard signs and apostrophes are dropped.
 */
const CYRILLIC_TO_LATIN: Readonly<Record<string, string>> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ie',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'iu',
  я: 'ia',
  "'": '',
  '’': '',
  ʼ: '',
};

/**
 * Transliterate Cyrillic characters in `input` to Latin. Latin letters,
 * digits, whitespace and punctuation pass through unchanged, so applying
 * this to an already-Latin string is a no-op.
 */
export function transliterate(input: string): string {
  let result = '';
  for (const char of input) {
    const lower = char.toLowerCase();
    const mapped = CYRILLIC_TO_LATIN[lower];
    if (mapped === undefined) {
      // Not a known Cyrillic char — keep as-is (Latin, digit, punctuation…).
      result += char;
      continue;
    }
    if (mapped === '') {
      continue;
    }
    // Preserve casing: capitalize the first letter when the source was upper-case.
    result += char === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
  }
  return result;
}

/**
 * Resolve the display name for the current language.
 * - uk: prefer the Ukrainian name (no transliteration).
 * - en: prefer the English name, falling back to the Ukrainian one, then
 *   transliterate so the result is always Latin (API `nameEn` often still
 *   contains Cyrillic).
 */
export function resolveDisplayName(
  nameUa: string | undefined | null,
  nameEn: string | undefined | null,
  lang: Language,
  fallback: string,
): string {
  if (lang === 'uk') {
    return nameUa?.trim() || nameEn?.trim() || fallback;
  }
  const base = nameEn?.trim() || nameUa?.trim() || '';
  return base ? transliterate(base) : fallback;
}
