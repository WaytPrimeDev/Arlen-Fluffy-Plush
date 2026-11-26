import type { Language } from './i18n.service';

/**
 * A breed the cattery works with permanently, and therefore a URL that exists
 * permanently.
 *
 * The catalogue is the source of truth for *stock* — which kittens are for
 * sale today — but it is a poor source of truth for *addresses*. A breed drops
 * out of `/breeds` the moment its last kitten is sold, and with it the page a
 * search result points at; the URL then 404s, Google drops it, and the ranking
 * built up over months has to be earned again when the next litter arrives.
 *
 * These three breeds are the cattery's own: Ragdoll as the main one, and the
 * British and Scottish cats it has bred since 2010. Their pages are declared
 * here so they are always in the sitemap and always answer 200, whether or not
 * the backend is currently serving the breed. When it is, the page lists its
 * kittens exactly as before; when it is not, the copy below is what the page
 * holds, which is a thin page but an honest one — and a URL Google can keep.
 *
 * Deliberately *not* linked from anywhere in the UI. The breed picker and the
 * breed filter are built from what the backend serves, so a visitor is never
 * offered a breed with nothing behind it. These URLs are for crawlers and for
 * links that already exist out in the world.
 */
export interface CanonicalBreed {
  /**
   * The URL segment, under `/breeds/`. Chosen as the term the breed is
   * actually searched by in English, since that is also the key the backend
   * mints its own slugs from — if it ever serves one of these breeds under the
   * same slug, the two become one page rather than two.
   */
  slug: string;
  /** The breed's name, per published language. */
  name: Record<Language, string>;
  /**
   * What this cattery has to say about the breed, in its own words. It is the
   * page's content when the backend has no kittens of the breed to show, so it
   * has to stand on its own — and it may claim nothing the About page does not.
   */
  intro: Record<Language, string>;
}

export const CANONICAL_BREEDS: readonly CanonicalBreed[] = [
  {
    slug: 'ragdoll',
    name: { uk: 'Регдол', en: 'Ragdoll' },
    intro: {
      uk:
        'Регдол — головна порода розплідника Arlen Fluffy Plush: ми працюємо з нею з 2021 року. ' +
        'Це великі напівдовгошерсті коти з блакитними очима й лагідним, людиноорієнтованим характером — ' +
        'вони легко приймають дітей та інших тварин і майже не бувають самі по собі. ' +
        'Кошенята регдол зростають у нас удома, їдуть до нових родин вакцинованими, чипованими та з документами WCF, ' +
        'з доставкою по Україні та в будь-яку країну світу.',
      en:
        'Ragdoll is the main breed at the Arlen Fluffy Plush cattery — we have worked with it since 2021. ' +
        'They are large semi-longhaired cats with blue eyes and a famously gentle, people-oriented temperament: ' +
        'they take easily to children and to other animals, and they rarely want to be left alone. ' +
        'Our Ragdoll kittens grow up at home and move to their new families vaccinated, microchipped and with WCF papers, ' +
        'delivered across Ukraine and to any country in the world.',
    },
  },
  {
    slug: 'british-shorthair',
    name: { uk: 'Британська короткошерста', en: 'British Shorthair' },
    intro: {
      uk:
        'Британські кошенята — одна з порід, із якими працює розплідник Arlen Fluffy Plush. ' +
        'Британці — щільні, спокійні коти з густою плюшевою шерстю та врівноваженим характером: ' +
        'вони прив’язуються до родини, але добре переносять самоту, тому підходять тим, хто багато працює. ' +
        'Кошенята зростають удома, мають документи WCF, вакцинацію та чипування, ' +
        'з доставкою по Україні та за кордон.',
      en:
        'British kittens are one of the breeds the Arlen Fluffy Plush cattery works with. ' +
        'British Shorthairs are solid, calm cats with a dense plush coat and an even temper: ' +
        'they attach themselves to the family but cope well with being alone, which suits a household that works long hours. ' +
        'Our kittens grow up at home and come with WCF papers, vaccinations and microchipping, ' +
        'delivered across Ukraine and abroad.',
    },
  },
  {
    slug: 'scottish-fold',
    name: { uk: 'Шотландська висловуха', en: 'Scottish Fold' },
    intro: {
      uk:
        'Шотландські коти стоять на початку історії розплідника Arlen Fluffy Plush: ' +
        'перша кішка, що з’явилася в нашому домі у 2010 році, була шотландською прямовухою. ' +
        'Шотландці — м’які, товариські коти середнього розміру; висловухі та прямовухі кошенята народжуються в одному пометі ' +
        'й відрізняються лише формою вушок. ' +
        'Кошенята зростають удома, мають документи WCF, вакцинацію та чипування, ' +
        'з доставкою по Україні та за кордон.',
      en:
        'Scottish cats are where the Arlen Fluffy Plush cattery began: ' +
        'the first cat to arrive in our home, back in 2010, was a Scottish Straight. ' +
        'Scottish cats are soft, sociable and medium-sized; fold-eared and straight-eared kittens are born in the same litter ' +
        'and differ only in the shape of their ears. ' +
        'Our kittens grow up at home and come with WCF papers, vaccinations and microchipping, ' +
        'delivered across Ukraine and abroad.',
    },
  },
];

/** The permanent breed URLs, for the sitemap and the server route table. */
export const CANONICAL_BREED_SLUGS: readonly string[] = CANONICAL_BREEDS.map(
  (breed) => breed.slug,
);

/** The permanent breed behind a `/breeds/:slug` URL, or null for any other slug. */
export function canonicalBreed(slug: string | null | undefined): CanonicalBreed | null {
  if (!slug) {
    return null;
  }

  const wanted = slug.trim().toLowerCase();
  return CANONICAL_BREEDS.find((breed) => breed.slug === wanted) ?? null;
}
