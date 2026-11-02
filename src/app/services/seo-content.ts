import type { Language } from './i18n.service';

export type SeoPageKey = 'home' | 'kittens' | 'parents' | 'about' | 'contacts';

export interface SeoPageCopy {
  /** Goes into <title>; the site name is appended by the service. */
  title: string;
  /** The snippet line under the title in Google results. Keep ~140-160 chars. */
  description: string;
  /** Breadcrumb label for this page. */
  breadcrumb: string;
}

/**
 * Snippet copy per page. Claims here are limited to what the cattery actually
 * does (WCF documents since 2016, the first cat in 2010, Ragdoll since 2021,
 * home-raised, vaccination, chipping, lifetime support, Ternopil, delivery to
 * any country, the Telegram and phone contacts) so the snippet never promises
 * more than the page delivers. The breed count is written as "dozens" rather
 * than a number: the catalogue changes constantly, and a number in a snippet
 * goes stale the week after it is written.
 *
 * The names a searcher might type — "Arlen Cat", "Arlen Plush", koshenya.com
 * and their Cyrillic spellings — belong to the same cattery, so they appear in
 * the copy alongside the WCF prefix rather than only in structured data.
 */
const COPY: Record<Language, Record<SeoPageKey, SeoPageCopy>> = {
  uk: {
    home: {
      title: 'Кошенята — розплідник Arlen Cat, доставка по світу',
      description:
        'Купити кошеня з документами WCF у розпліднику Arlen Cat: регдол та десятки інших порід. Доставка кошенят по Україні, у Німеччину, ЄС, США — по всьому світу.',
      breadcrumb: 'Головна',
    },
    kittens: {
      title: 'Кошенята у продажу — ціна, фото, доставка',
      description:
        'Кошенята у продажу від розплідника Arlen Cat: фото, вік, стать, окрас і ціна. Регдол, британські, шотландські та інші породи. Доставка у Німеччину, ЄС, США.',
      breadcrumb: 'Кошенята',
    },
    parents: {
      title: 'Коти та кішки розплідника Arlen Cat',
      description:
        'Батьки наших кошенят у розпліднику Arlen Fluffy Plush: порода, окрас, титули та фотогалерея кожного дорослого кота й кішки з документами WCF.',
      breadcrumb: 'Батьки',
    },
    about: {
      title: 'Про розплідник Arlen Fluffy Plush (Arlen Cat)',
      description:
        'Історія розплідника Arlen Cat: перша кішка у 2010, WCF із 2016, регдол із 2021. Кошенята зростають удома, доставка у Німеччину, ЄС, США та інші країни.',
      breadcrumb: 'Про нас',
    },
    contacts: {
      title: 'Контакти розплідника кошенят Arlen Cat',
      description:
        'Контакти розплідника Arlen Cat: Telegram, телефон, e-mail, Тернопіль. Запитайте про вільних кошенят, ціну, бронювання та доставку у вашу країну.',
      breadcrumb: 'Контакти',
    },
  },
  en: {
    home: {
      title: 'Kittens for sale — Arlen Cat cattery, worldwide delivery',
      description:
        'Buy a kitten with WCF papers from the Arlen Cat cattery: Ragdoll and dozens of other breeds. Worldwide delivery — Germany, the EU, the USA and beyond.',
      breadcrumb: 'Home',
    },
    kittens: {
      title: 'Kittens for sale — price, photos, delivery',
      description:
        'Kittens for sale from the Arlen Cat cattery: photos, age, sex, colour and price. Ragdoll, British, Scottish and dozens of other breeds, delivered worldwide.',
      breadcrumb: 'Kittens',
    },
    parents: {
      title: 'Queens and studs of the Arlen Cat cattery',
      description:
        'The parents behind our kittens at Arlen Fluffy Plush: breed, colour, titles and a photo gallery of every adult cat, all WCF-registered.',
      breadcrumb: 'Parents',
    },
    about: {
      title: 'About the Arlen Fluffy Plush (Arlen Cat) cattery',
      description:
        'The story of the Arlen Cat cattery: our first cat in 2010, WCF since 2016, Ragdolls since 2021. Kittens raised at home and delivered to any country.',
      breadcrumb: 'About',
    },
    contacts: {
      title: 'Contact the Arlen Cat kitten cattery',
      description:
        'Contact the Arlen Cat cattery: Telegram, phone, e-mail, Ternopil, Ukraine. Ask about available kittens, pricing, reservation and delivery to your country.',
      breadcrumb: 'Contacts',
    },
  },
};

/**
 * What the cattery is, in one sentence, for the `description` of the
 * Organization node. Same claims as the About page.
 */
export const ORGANIZATION_DESCRIPTION: Record<Language, string> = {
  uk:
    'Розплідник кошенят Arlen Fluffy Plush (Arlen Cat) із Тернополя, зареєстрований у World Cat Federation із 2016 року. ' +
    'Головна порода — регдол, поряд із нею в розпліднику є десятки інших порід, зокрема британські та шотландські. ' +
    'Кошенята зростають удома, їдуть до нових родин вакцинованими, чипованими та з документами WCF. ' +
    'Доставляємо кошенят по Україні та в будь-яку країну світу — Німеччину, країни ЄС, США, Канаду та інші.',
  en:
    'Arlen Fluffy Plush (Arlen Cat) is a kitten cattery in Ternopil, Ukraine, registered with the World Cat Federation since 2016. ' +
    'Ragdoll is our main breed, alongside dozens of others including British and Scottish cats. ' +
    'Our kittens grow up at home and move to their new families vaccinated, microchipped and with WCF papers. ' +
    'We deliver kittens across Ukraine and to any country in the world — Germany, the EU, the USA, Canada and beyond.',
};

/**
 * Breeds the cattery is known for, for the `knowsAbout` of the organization.
 * The catalogue holds dozens and changes constantly, so this lists the ones
 * the site presents consistently — Ragdoll first, as the main breed — plus the
 * general subjects the cattery is an authority on.
 */
export const BREEDS: Record<Language, readonly string[]> = {
  uk: [
    'Регдол',
    'Британська короткошерста',
    'Британська довгошерста',
    'Шотландська висловуха',
    'Шотландська пряма',
    'Породисті кошенята',
    'Розведення кішок',
  ],
  en: [
    'Ragdoll',
    'British Shorthair',
    'British Longhair',
    'Scottish Fold',
    'Scottish Straight',
    'Pedigree kittens',
    'Cat breeding',
  ],
};

/**
 * Terms the site is about, in the words of its own pages. Google ignores the
 * keywords meta tag, but Bing and Yandex still read it, and both matter for a
 * Ukrainian cattery that ships abroad.
 *
 * Three groups, in order: what is being sold, where it is delivered, and what
 * the cattery is called — including the Cyrillic spellings of the Latin names,
 * because that is how a Ukrainian visitor types them from memory.
 */
export const KEYWORDS: Record<Language, readonly string[]> = {
  uk: [
    'кошеня',
    'кошенята',
    'кошеня Україна',
    'кошенята Україна',
    'купити кошеня',
    'купити кошенят',
    'кошенята у продажу',
    'продаж кошенят',
    'розплідник кошенят',
    'розплідник кошенят Україна',
    'кошеня Тернопіль',
    'породисті кошенята',
    'кошенята з документами WCF',
    'кошеня з родоводом',
    'кошенята регдол',
    'купити регдола',
    'британські кошенята',
    'шотландські кошенята',
    'кошеня з доставкою',
    'кошеня з доставкою по всьому світу',
    'доставка кошенят за кордон',
    'кошеня в Німеччину',
    'кошенята в Німеччину',
    'кошеня в Польщу',
    'кошеня в Європу',
    'кошеня у США',
    'кошеня в Канаду',
    'Arlen Cat',
    'Arlen Fluffy Plush',
    'Arlen Plush',
    'арлен кет',
    'арлен флафі плаш',
    'арлен флафі кет',
    'розплідник арлен',
    'кошеня ком',
    'koshenya.com',
  ],
  en: [
    'kitten',
    'kittens',
    'kittens for sale',
    'buy a kitten',
    'buy a kitten online',
    'kitten cattery',
    'kittens Ukraine',
    'cattery Ukraine',
    'pedigree kittens',
    'purebred kittens',
    'WCF registered kittens',
    'Ragdoll kittens',
    'buy a Ragdoll',
    'British Shorthair kittens',
    'British Longhair kittens',
    'Scottish Fold kittens',
    'Scottish Straight kittens',
    'kitten worldwide delivery',
    'kitten shipping worldwide',
    'kitten delivery to Germany',
    'buy a kitten in Germany',
    'kitten to Poland',
    'kitten to Europe',
    'kitten to the USA',
    'kitten to Canada',
    'Arlen Cat',
    'Arlen Fluffy Plush',
    'Arlen Plush',
    'Arlen Cat cattery',
    'koshenya.com',
  ],
};

/** Dates come pre-formatted and may already end in a period. */
function sentencePart(value: string): string {
  return value.replace(/[.\s]+$/, '');
}

export function seoCopy(language: Language, key: SeoPageKey): SeoPageCopy {
  return COPY[language][key];
}

/** Wording reused by the dynamic detail pages. */
export const DETAIL_COPY = {
  uk: {
    kittenTitle: (name: string, breed: string) =>
      breed ? `Кошеня ${name} — ${breed}, у продажу` : `Кошеня ${name} — у продажу`,
    kittenDescription: (name: string, breed: string, color: string, age: string) =>
      `${name} — кошеня${breed ? ` породи ${breed}` : ''}${color ? `, окрас ${color}` : ''} ` +
      'з розплідника Arlen Fluffy Plush (Arlen Cat). ' +
      `${age ? `Дата народження: ${sentencePart(age)}. ` : ''}` +
      'Документи WCF, вакцинація, чипування. Ціна, фото, батьки та доставка в будь-яку країну світу.',
    parentTitle: (name: string, breed: string) => (breed ? `${name} — ${breed}` : name),
    parentDescription: (name: string, breed: string, color: string) =>
      `${name}${breed ? ` — ${breed}` : ''}${color ? `, окрас ${color}` : ''}. ` +
      'Дивіться фотогалерею, характеристики та кошенят цього кота в розпліднику Arlen Fluffy Plush (Arlen Cat).',
  },
  en: {
    kittenTitle: (name: string, breed: string) =>
      breed ? `${name} the ${breed} kitten — for sale` : `${name} the kitten — for sale`,
    kittenDescription: (name: string, breed: string, color: string, age: string) =>
      `${name} is a${breed ? ` ${breed}` : ''} kitten${color ? ` with ${color} colouring` : ''} ` +
      'from the Arlen Fluffy Plush (Arlen Cat) cattery. ' +
      `${age ? `Born ${sentencePart(age)}. ` : ''}` +
      'WCF papers, vaccinations and microchipping. Price, photos, parents and worldwide delivery.',
    parentTitle: (name: string, breed: string) => (breed ? `${name} — ${breed}` : name),
    parentDescription: (name: string, breed: string, color: string) =>
      `${name}${breed ? ` — ${breed}` : ''}${color ? `, ${color} colouring` : ''}. ` +
      'See the photo gallery, traits and kittens of this cat at the Arlen Fluffy Plush (Arlen Cat) cattery.',
  },
} as const;
