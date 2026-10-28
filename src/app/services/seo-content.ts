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
 * Snippet copy per page. Claims here are limited to what the site itself
 * states (WCF documents since 2016, the first cat in 2010, Ragdoll since 2021,
 * home-raised, vaccination, chipping, lifetime support, Ternopil, the Telegram
 * and phone contacts) so the snippet never promises more than the page
 * delivers. The names a searcher might type — "Arlen Cat", "Arlen Plush",
 * koshenya.com — belong to the same cattery, so they appear in the copy
 * alongside the WCF prefix rather than only in structured data.
 */
const COPY: Record<Language, Record<SeoPageKey, SeoPageCopy>> = {
  uk: {
    home: {
      title: 'Розплідник кошенят Arlen Cat — кошенята з документами WCF',
      description:
        'Розплідник кошенят Arlen Fluffy Plush (Arlen Cat) у Тернополі: кошенята регдол, британські та шотландські з документами WCF, вакцинацією та чипуванням.',
      breadcrumb: 'Головна',
    },
    kittens: {
      title: 'Кошенята у продажу — ціна, фото, вік',
      description:
        'Кошенята у продажу від розплідника Arlen Cat: фото, вік, стать, окрас, ціна та батьки кожного малюка. Регдол, британські та шотландські кошенята.',
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
        'Історія розплідника Arlen Cat (раніше arlen-cat.jimdofree.com): перша кішка у 2010 році, WCF із 2016, регдол із 2021. Кошенята зростають удома.',
      breadcrumb: 'Про нас',
    },
    contacts: {
      title: 'Контакти розплідника кошенят Arlen Cat',
      description:
        'Контакти розплідника Arlen Fluffy Plush (Arlen Cat): Telegram, телефон, e-mail, Тернопіль. Розкажемо про вільних кошенят, ціну та умови бронювання.',
      breadcrumb: 'Контакти',
    },
  },
  en: {
    home: {
      title: 'Arlen Cat kitten cattery — WCF-registered kittens',
      description:
        'Arlen Fluffy Plush (Arlen Cat) kitten cattery in Ternopil, Ukraine: Ragdoll, British and Scottish kittens with WCF papers, vaccinations and microchipping.',
      breadcrumb: 'Home',
    },
    kittens: {
      title: 'Kittens for sale — price, photos, age',
      description:
        'Kittens for sale from the Arlen Cat cattery: photos, age, sex, colour, price and the parents of every kitten. Ragdoll, British and Scottish kittens.',
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
        'The story of the Arlen Cat cattery (formerly arlen-cat.jimdofree.com): our first cat in 2010, WCF since 2016, Ragdolls since 2021. Kittens raised at home.',
      breadcrumb: 'About',
    },
    contacts: {
      title: 'Contact the Arlen Cat kitten cattery',
      description:
        'Contact the Arlen Fluffy Plush (Arlen Cat) cattery: Telegram, phone, e-mail, Ternopil. Ask about available kittens, pricing and reservation terms.',
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
    'Кошенята регдол, британські та шотландські зростають удома, їдуть до нових родин вакцинованими, чипованими та з документами WCF.',
  en:
    'Arlen Fluffy Plush (Arlen Cat) is a kitten cattery in Ternopil, Ukraine, registered with the World Cat Federation since 2016. ' +
    'Our Ragdoll, British and Scottish kittens grow up at home and move to their new families vaccinated, microchipped and with WCF papers.',
};

/** The breeds the site actually presents, for the `knowsAbout` of the cattery. */
export const BREEDS: Record<Language, readonly string[]> = {
  uk: ['Регдол', 'Британська короткошерста', 'Шотландська'],
  en: ['Ragdoll', 'British Shorthair', 'Scottish Fold'],
};

/**
 * Terms the site is about, in the words of its own pages. Google ignores the
 * keywords meta tag, but Bing and Yandex still read it, and both matter for a
 * Ukrainian cattery.
 */
export const KEYWORDS: Record<Language, readonly string[]> = {
  uk: [
    'розплідник кошенят',
    'кошенята у продажу',
    'купити кошеня',
    'кошенята регдол',
    'британські кошенята',
    'шотландські кошенята',
    'кошенята з документами WCF',
    'Arlen Cat',
    'Arlen Fluffy Plush',
    'Arlen Plush',
    'кошеня Тернопіль',
  ],
  en: [
    'kitten cattery',
    'kittens for sale',
    'buy a kitten',
    'Ragdoll kittens',
    'British Shorthair kittens',
    'Scottish kittens',
    'WCF registered kittens',
    'Arlen Cat',
    'Arlen Fluffy Plush',
    'Arlen Plush',
    'kittens Ukraine',
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
      'Документи WCF, вакцинація, чипування. Фото, батьки, ціна та умови бронювання.',
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
      'WCF papers, vaccinations and microchipping. Photos, parents, price and reservation details.',
    parentTitle: (name: string, breed: string) => (breed ? `${name} — ${breed}` : name),
    parentDescription: (name: string, breed: string, color: string) =>
      `${name}${breed ? ` — ${breed}` : ''}${color ? `, ${color} colouring` : ''}. ` +
      'See the photo gallery, traits and kittens of this cat at the Arlen Fluffy Plush (Arlen Cat) cattery.',
  },
} as const;
