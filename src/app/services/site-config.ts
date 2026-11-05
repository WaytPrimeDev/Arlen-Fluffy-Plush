/**
 * Identity of the cattery, used for canonical URLs, Open Graph and JSON-LD.
 *
 * The contact details are the ones published on the contacts page, so the
 * structured data repeats exactly what a visitor can read on the site.
 * Fields left as `null` are simply omitted from the markup.
 */
export const SITE = {
  name: 'Arlen Fluffy Plush',
  /**
   * The one host search engines should index. Canonical URLs, the sitemap and
   * robots.txt are pinned to it, so preview deployments on *.vercel.app point
   * at production instead of competing with it for the same content.
   *
   * It carries the `www`, because that is the host the site is served from:
   * the apex answers a request with a 308 to it. The two have to agree, since
   * a page served from any host but this one is marked `noindex`.
   */
  canonicalOrigin: 'https://www.koshenya.com',
  /** Shown as the site name in the Google snippet and in social cards. */
  shortName: 'Arlen Fluffy Plush',
  /**
   * The names people actually search this cattery by: the WCF prefix "Arlen
   * Fluffy Plush", registered since 2016, its shortenings, and the site's own
   * domain. All of them are declared as names of the same organization instead
   * of letting Google guess. Every entry must be a name of this cattery — no
   * other cattery's name belongs here.
   *
   * The Cyrillic spellings are here because that is how a Ukrainian visitor
   * types a Latin name from memory — "арлен флафі плаш", "арлен флафі кет",
   * "кошеня ком". Each is a separate string: Google matches a query against the whole
   * `alternateName` value, so a spelling that is not listed is not matched.
   */
  alternateNames: [
    'Arlen Plush',
    'Arlen Fluffy Plush Cattery',
    'Розплідник Arlen Fluffy Plush',
    'Арлен Флафі Плаш',
    'Арлен Флаффі Плаш',
    'Арлен Флафі Кет',
    'Розплідник Арлен',
    'koshenya.com',
    'Кошеня ком',
    'Кошеня.com',
  ] as readonly string[],
  logoPath: '/assets/img/navigation/photo_2024-08-31_20-45-32.png',
  /**
   * Default social card: the brand banner, shown when a link to a static page
   * is pasted into a messenger or a social network. Detail pages use the
   * animal's own photo instead. The file is 766x426 rather than the
   * recommended 1200x630 — it clears every platform minimum but looks soft on
   * a dense screen, so replace it with a larger export when one exists.
   */
  socialImagePath: '/assets/img/social-cover.jpg' as string | null,
  telegram: 'https://t.me/arlenfluffyplush',
  /** As published on the contacts page. */
  email: 'arlen.fluffy.plush@gmail.com' as string | null,
  telephone: '+380933814571' as string | null,
  /** ISO 3166-1 alpha-2 country the cattery operates from. */
  countryCode: 'UA',
  /** City on the contacts page, spelled per language for the postal address. */
  locality: { uk: 'Тернопіль', en: 'Ternopil' } as const,
  /**
   * The channels this cattery owns and publishes on. `sameAs` is what tells
   * Google that a query for one of these handles is a query for this site — it
   * links our own profiles together without redirecting anyone anywhere.
   *
   * Only properties this cattery owns belong here. Arlen Fluffy Plush is an
   * independent cattery: no third-party or predecessor site may be listed, in
   * `sameAs` or anywhere else, since listing one asserts a relationship we
   * have no right to claim.
   */
  profiles: [
    'https://t.me/arlenfluffyplush',
    'https://t.me/kittensarlenfluffyplush',
    'https://www.instagram.com/natalya.turusheva_1',
    'https://www.tiktok.com/@natalyaturusheva',
    'https://www.facebook.com/Arlen-Fluffy-Plush-1642778172491033/',
  ] as readonly string[],
} as const;

/**
 * Where a kitten can actually be sent. The cattery delivers worldwide, which
 * `areaServed` says in one line, but shopping and local surfaces match on
 * concrete regions — so the countries buyers ask for most often are named too,
 * as ISO 3166-1 alpha-2 codes. Ukraine comes first; it is where the cattery is.
 *
 * This is not a closed list of what is possible, only of what is declared.
 * Adding a country here is safe; the delivery itself is agreed per kitten.
 */
export const DELIVERY_COUNTRIES = [
  'UA',
  'DE',
  'PL',
  'AT',
  'CH',
  'CZ',
  'SK',
  'HU',
  'RO',
  'NL',
  'BE',
  'FR',
  'IT',
  'ES',
  'PT',
  'SE',
  'NO',
  'DK',
  'FI',
  'IE',
  'GB',
  'LT',
  'LV',
  'EE',
  'US',
  'CA',
  'AE',
  'IL',
] as const;

/** Languages the site publishes content in. */
export const SEO_LOCALES = {
  uk: { htmlLang: 'uk', ogLocale: 'uk_UA' },
  en: { htmlLang: 'en', ogLocale: 'en_US' },
} as const;
