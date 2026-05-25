import { Injectable, signal, effect } from '@angular/core';

export type Language = 'en' | 'uk';

export interface Translations {
  [key: string]: string | Translations;
}

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly language = signal<Language>('en');
  public readonly language$ = this.language.asReadonly();

  private translations: Map<Language, Translations> = new Map();

  constructor() {
    this.initializeTranslations();
    this.loadLanguageFromStorage();
  }

  private initializeTranslations() {
    this.translations.set('en', {
      // Navigation
      home: 'Home',
      parents: 'Parents',
      kittens: 'Kittens',
      families: 'Families',
      language: 'Language',

      // Pages
      homeTitle: 'Welcome to Arlen Fluffy Plush',
      homeDescription: 'Beautiful British Shorthair Kittens',

      // Parents page
      parentsTitle: 'Our Parents',
      parentsDescription: 'Meet the beautiful parents of our kittens',
      breed: 'Breed',
      color: 'Color',
      sex: 'Sex',
      male: 'Male',
      female: 'Female',

      // Kittens page
      kittensTitle: 'Available Kittens',
      kittensDescription: 'Our beautiful kittens are looking for their loving homes',
      birthDate: 'Birth Date',
      status: 'Status',
      price: 'Price',
      petPrice: 'Pet',
      breedingPrice: 'Breeding',
      available: 'Available',
      reserved: 'Reserved',
      sold: 'Sold',
      all: 'All',

      // Families page
      familiesTitle: 'Kitten Families',
      familiesDescription: 'Our kitten families and their heritage',
      mom: 'Mom',
      dad: 'Dad',
      created: 'Created',
      updated: 'Updated',
      notSpecified: 'Not specified',
      noKittensYet: 'No kittens yet',
      noFamiliesYet: 'No families yet',
      retry: 'Retry',

      // Common
      loading: 'Loading...',
      error: 'Error loading data',
      noData: 'No data available',
      details: 'Details',
      loadMore: 'Load more',
      filterByBreed: 'Breed',
      filterByColor: 'Color',
      allBreeds: 'All breeds',
      allColors: 'All colors',
      filterAndSort: 'Filter & Sort',
      view: 'View',
      allKittens: 'All Available Kittens',
      byParents: 'By Parents',
      filterByMother: 'Mother',
      filterByFather: 'Father',
      filterByGender: 'Gender',
      allMothers: 'All mothers',
      allFathers: 'All fathers',
      allGenders: 'All genders',
      resetAllFilters: 'Reset All Filters',
      litterFrom: 'Litter from',
      availableKittens: 'Available Kittens',
      noKittensMatchFilters:
        'No kittens match your filters. Try adjusting your selection.',
      viewDetails: 'View Details',

      // Parent detail page
      backToParents: 'Back to Parents',
      queen: 'Queen',
      stud: 'Stud',
      kittensOfThisQueen: 'Kittens of this Queen',
      kittensOfThisStud: 'Kittens of this Stud',
      kittensOfThisParent: 'Kittens of this Parent',

      // Kitten detail page
      backToKittens: 'Back to Kittens',
      specifications: 'Specifications',
      colorAndPattern: 'Color',
      birthdate: 'Birthdate',
      personality: 'Personality',
      personalityPlaceholder: 'A loving and curious kitten, raised in a family environment with daily socialization. Adapts well to new homes and bonds quickly with people.',
      healthInformation: 'Health Information',
      fullyVaccinated: 'Fully Vaccinated',
      healthCertified: 'Health Certified',
      healthDetailsPlaceholder: 'All kittens are examined by a veterinarian, vaccinated by age, and treated against parasites before leaving the cattery.',
      mother: 'Mother',
      father: 'Father',
      interestedIn: 'Interested in',
      telegramCtaSubtext: 'Contact us on Telegram for pricing and adoption details. We\'re happy to answer any questions.',
      contactOnTelegram: 'Contact us on Telegram',

      // Kittens page hero & tabs
      exploreOurKittens: 'Explore Our Kittens',
      exploreOurKittensSubtitle: 'Find your perfect fluffy companion from our carefully bred kittens',
      availableKittensTab: 'Available Kittens',
      ourParentsTab: 'Our Parents',
      ourQueens: 'Our Queens',
      ourStuds: 'Our Studs',
      noParentsMatchFilter: 'No parents match your filter.',
      viewMode: 'View mode',

      // Header
      premiumKittens: 'Premium Kittens',
      aboutUs: 'About Us',
      contacts: 'Contacts',

      // Footer
      footerAbout: 'Breeding exceptional fluffy kittens with love and dedication. Our commitment to excellence has been recognized worldwide.',
      quickLinks: 'Quick Links',
      ourStory: 'Our Story',
      contactUs: 'Contact Us',
      connectWithUs: 'Connect With Us',
      allRightsReserved: 'All rights reserved.',
      madeWith: 'Made with',
      forFluffyFriends: 'for fluffy friends',

      // About page
      aboutHeroTitle: 'Our Story',
      aboutHeroSubtitle: 'A journey of passion, dedication, and love for exceptional fluffy kittens',
      aboutIntroTitle: 'Breeding Excellence Since 2018',
      aboutIntroP1: 'Arlen Fluffy Plush began with a simple yet profound mission: to breed the most beautiful, healthy, and affectionate fluffy kittens while maintaining the highest ethical standards in the industry.',
      aboutIntroP2: 'What started as a small passion project has grown into an internationally recognized cattery, known for producing champion-quality kittens with exceptional temperaments. Every kitten born here is a testament to our unwavering commitment to excellence.',
      aboutIntroP3: 'We believe that breeding is not just about producing beautiful cats — it\'s about creating healthy, happy companions that will bring joy to families for years to come. This philosophy guides every decision we make.',
      coreValues: 'Our Core Values',
      valueLoveTitle: 'Love & Care',
      valueLoveDesc: 'Every kitten is raised in our home with unlimited love, attention, and socialization from day one.',
      valueExcellenceTitle: 'Excellence',
      valueExcellenceDesc: 'We maintain the highest standards in breeding, focusing on health, temperament, and breed characteristics.',
      valueIntegrityTitle: 'Integrity',
      valueIntegrityDesc: 'Our ethical breeding practices and transparency have earned us the trust of families worldwide.',
      ourJourney: 'Our Journey',
      milestone2018Title: 'The Beginning',
      milestone2018Desc: 'Arlen Fluffy Plush was founded with a passion for breeding exceptional fluffy kittens. Our journey started with two Persian cats and a dream.',
      milestone2019Title: 'First Champions',
      milestone2019Desc: 'Our first litter produced two champion-quality kittens, validating our commitment to excellence and ethical breeding practices.',
      milestone2021Title: 'International Recognition',
      milestone2021Desc: 'Expanded our breeding program and received our first international recognition from CFA for exceptional breeding standards.',
      milestone2023Title: 'Award-Winning Excellence',
      milestone2023Desc: 'Honored as Health & Wellness Champion and recognized for maintaining the highest standards in kitten care and breeding.',
      milestone2024Title: 'Expanding Horizons',
      milestone2024Desc: 'Added Ragdoll and British Shorthair breeds to our program, while maintaining our commitment to quality over quantity.',
      milestone2025Title: 'Best Cattery Award',
      milestone2025Desc: 'Received the prestigious Best Cattery of the Year award from CFA International, cementing our place among elite breeders.',
      awardsTitle: 'Awards & Achievements',
      award1Title: 'Best Cattery of the Year',
      award1Org: 'CFA International',
      award1Desc: 'Awarded for excellence in breeding practices and outstanding kittens.',
      award2Title: 'Excellence in Persian Breeding',
      award2Org: 'TICA',
      award2Desc: 'Recognition for producing exceptional Persian cats with champion bloodlines.',
      award3Title: 'Top Breeder Award',
      award3Org: 'World Cat Federation',
      award3Desc: 'Honored as one of the top breeders worldwide for ethical practices.',
      award4Title: 'Health & Wellness Champion',
      award4Org: 'International Cat Care',
      award4Desc: 'Recognized for maintaining the highest standards in kitten health and wellness.',

      // Contacts page
      connectWithUsHero: 'Connect With Us',
      connectWithUsSubtitle: 'We\'d love to hear from you! Reach out with any questions about our kittens.',
      contactInformation: 'Contact Information',
      contactEmail: 'Email',
      contactPhone: 'Phone',
      contactLocation: 'Location',
      followUs: 'Follow Us',
      ourPartners: 'Our Partners',
      ourPartnersSubtitle: 'We are proud members of these prestigious cat associations, committed to upholding the highest standards in breeding and cat welfare.',
    });

    this.translations.set('uk', {
      // Navigation
      home: 'Головна',
      parents: 'Батьки',
      kittens: 'Кошенята',
      families: 'Сім\'ї',
      language: 'Мова',

      // Pages
      homeTitle: 'Ласкаво просимо до Arlen Fluffy Plush',
      homeDescription: 'Прекрасні британські короткошерсті кошенята',

      // Parents page
      parentsTitle: 'Наші батьки',
      parentsDescription: 'Познайомтеся з чудовими батьками наших кошенят',
      breed: 'Порода',
      color: 'Колір',
      sex: 'Стать',
      male: 'Самець',
      female: 'Самиця',

      // Kittens page
      kittensTitle: 'Доступні кошенята',
      kittensDescription: 'Наші прекрасні кошенята шукають люблячого дому',
      birthDate: 'Дата народження',
      status: 'Статус',
      price: 'Ціна',
      petPrice: 'Домашнє',
      breedingPrice: 'Розведення',
      available: 'Доступне',
      reserved: 'Зарезервоване',
      sold: 'Продано',
      all: 'Усі',

      // Families page
      familiesTitle: 'Сім\'ї кошенят',
      familiesDescription: 'Наші сім\'ї кошенят та їхня спадщина',
      mom: 'Мама',
      dad: 'Тато',
      created: 'Створено',
      updated: 'Оновлено',
      notSpecified: 'Не вказано',
      noKittensYet: 'Поки що без кошенят',
      noFamiliesYet: 'Поки що немає сімей',
      retry: 'Спробувати ще',

      // Common
      loading: 'Завантаження...',
      error: 'Помилка завантаження даних',
      noData: 'Немає доступних даних',
      details: 'Деталі',
      loadMore: 'Завантажити ще',
      filterByBreed: 'Порода',
      filterByColor: 'Колір',
      allBreeds: 'Усі породи',
      allColors: 'Усі кольори',
      filterAndSort: 'Фільтр і сортування',
      view: 'Вигляд',
      allKittens: 'Усі доступні кошенята',
      byParents: 'За батьками',
      filterByMother: 'Мама',
      filterByFather: 'Тато',
      filterByGender: 'Стать',
      allMothers: 'Усі мами',
      allFathers: 'Усі тата',
      allGenders: 'Усі статі',
      resetAllFilters: 'Скинути всі фільтри',
      litterFrom: 'Від',
      availableKittens: 'Доступні кошенята',
      noKittensMatchFilters:
        'Жодне кошеня не відповідає фільтрам. Спробуйте змінити вибір.',
      viewDetails: 'Детальніше',

      // Parent detail page
      backToParents: 'Назад до батьків',
      queen: 'Мама',
      stud: 'Тато',
      kittensOfThisQueen: 'Кошенята цієї мами',
      kittensOfThisStud: 'Кошенята цього тата',
      kittensOfThisParent: 'Кошенята цього батька',

      // Kitten detail page
      backToKittens: 'Назад до кошенят',
      specifications: 'Характеристики',
      colorAndPattern: 'Колір',
      birthdate: 'Дата народження',
      personality: 'Характер',
      personalityPlaceholder: 'Лагідне та допитливе кошеня, виховане в родинній атмосфері з щоденною соціалізацією. Швидко звикає до нового дому та прив\'язується до людей.',
      healthInformation: 'Здоров\'я',
      fullyVaccinated: 'Повністю вакциновано',
      healthCertified: 'Сертифікат здоров\'я',
      healthDetailsPlaceholder: 'Усі кошенята оглянуті ветеринаром, вакциновані за віком та оброблені від паразитів перед переїздом.',
      mother: 'Мама',
      father: 'Тато',
      interestedIn: 'Зацікавилися',
      telegramCtaSubtext: 'Напишіть нам у Telegram, щоб дізнатися ціну та деталі. Ми залюбки відповімо на всі запитання.',
      contactOnTelegram: 'Написати в Telegram',

      // Kittens page hero & tabs
      exploreOurKittens: 'Наші кошенята',
      exploreOurKittensSubtitle: 'Знайдіть ідеального пухнастого друга з-поміж наших дбайливо вирощених кошенят',
      availableKittensTab: 'Доступні кошенята',
      ourParentsTab: 'Наші батьки',
      ourQueens: 'Наші мами',
      ourStuds: 'Наші тата',
      noParentsMatchFilter: 'Немає батьків, що відповідають фільтру.',
      viewMode: 'Режим перегляду',

      // Header
      premiumKittens: 'Преміум кошенята',
      aboutUs: 'Про нас',
      contacts: 'Контакти',

      // Footer
      footerAbout: 'Розводимо виняткових пухнастих кошенят із любов\'ю та відданістю. Наше прагнення до досконалості визнано в усьому світі.',
      quickLinks: 'Швидкі посилання',
      ourStory: 'Наша історія',
      contactUs: 'Зв\'язатися з нами',
      connectWithUs: 'Зв\'язок з нами',
      allRightsReserved: 'Усі права захищені.',
      madeWith: 'Зроблено з',
      forFluffyFriends: 'для пухнастих друзів',

      // About page
      aboutHeroTitle: 'Наша історія',
      aboutHeroSubtitle: 'Подорож пристрасті, відданості та любові до виняткових пухнастих кошенят',
      aboutIntroTitle: 'Досконалість у розведенні з 2018 року',
      aboutIntroP1: 'Arlen Fluffy Plush розпочав діяльність із простою, але глибокою місією: виводити найкрасивіших, найздоровіших та найлагідніших пухнастих кошенят, дотримуючись найвищих етичних стандартів галузі.',
      aboutIntroP2: 'Те, що починалося як невеликий пристрасний проект, перетворилося на міжнародно визнаний розплідник, відомий виробництвом кошенят чемпіонської якості з винятковим темпераментом. Кожне кошеня, народжене тут, є свідченням нашої незламної відданості досконалості.',
      aboutIntroP3: 'Ми вважаємо, що розведення — це не лише виробництво красивих котів, але й створення здорових, щасливих компаньйонів, які принесуть радість родинам на довгі роки.',
      coreValues: 'Наші цінності',
      valueLoveTitle: 'Любов та турбота',
      valueLoveDesc: 'Кожне кошеня виховується в нашому домі з необмеженою любов\'ю, увагою та соціалізацією з першого дня.',
      valueExcellenceTitle: 'Досконалість',
      valueExcellenceDesc: 'Ми підтримуємо найвищі стандарти в розведенні, зосереджуючись на здоров\'ї, темпераменті та характеристиках породи.',
      valueIntegrityTitle: 'Чесність',
      valueIntegrityDesc: 'Наші етичні практики розведення та прозорість завоювали довіру родин по всьому світу.',
      ourJourney: 'Наш шлях',
      milestone2018Title: 'Початок',
      milestone2018Desc: 'Arlen Fluffy Plush був заснований із пристрастю до розведення виняткових пухнастих кошенят. Наш шлях розпочався з двох перських кішок і мрії.',
      milestone2019Title: 'Перші чемпіони',
      milestone2019Desc: 'Наш перший послід дав двох кошенят чемпіонської якості, підтвердивши нашу відданість досконалості та етичним практикам розведення.',
      milestone2021Title: 'Міжнародне визнання',
      milestone2021Desc: 'Розширили нашу програму розведення та отримали перше міжнародне визнання від CFA за виняткові стандарти розведення.',
      milestone2023Title: 'Відзначена досконалість',
      milestone2023Desc: 'Удостоєні звання чемпіона здоров\'я та благополуччя та визнані за підтримку найвищих стандартів догляду за кошенятами.',
      milestone2024Title: 'Розширення горизонтів',
      milestone2024Desc: 'Додали породи Регдол та Британська короткошерста до нашої програми, зберігаючи при цьому пріоритет якості над кількістю.',
      milestone2025Title: 'Нагорода найкращого розплідника',
      milestone2025Desc: 'Отримали престижну нагороду «Найкращий розплідник року» від CFA International, закріпивши наше місце серед елітних заводчиків.',
      awardsTitle: 'Нагороди та досягнення',
      award1Title: 'Найкращий розплідник року',
      award1Org: 'CFA International',
      award1Desc: 'Нагороджено за досконалість у практиках розведення та видатних кошенят.',
      award2Title: 'Досконалість у розведенні перських кішок',
      award2Org: 'TICA',
      award2Desc: 'Визнання за виробництво виняткових перських кішок із родоводами чемпіонів.',
      award3Title: 'Нагорода найкращого заводчика',
      award3Org: 'Всесвітня федерація кішок',
      award3Desc: 'Відзначено як одного з найкращих заводчиків світу за етичні практики.',
      award4Title: 'Чемпіон у сфері здоров\'я та благополуччя',
      award4Org: 'International Cat Care',
      award4Desc: 'Визнано за підтримку найвищих стандартів здоров\'я та добробуту кошенят.',

      // Contacts page
      connectWithUsHero: 'Зв\'язок з нами',
      connectWithUsSubtitle: 'Ми будемо раді почути від вас! Звертайтеся з будь-якими питаннями про наших кошенят.',
      contactInformation: 'Контактна інформація',
      contactEmail: 'Електронна пошта',
      contactPhone: 'Телефон',
      contactLocation: 'Локація',
      followUs: 'Підписуйтесь',
      ourPartners: 'Наші партнери',
      ourPartnersSubtitle: 'Ми пишаємося членством у цих престижних кошачих асоціаціях, які підтримують найвищі стандарти розведення та благополуччя котів.',
    });
  }

  setLanguage(lang: Language) {
    this.language.set(lang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  }

  getLanguage(): Language {
    return this.language();
  }

  private loadLanguageFromStorage() {
    if (typeof localStorage === 'undefined' && typeof navigator === 'undefined') {
      // SSR environment - use default
      this.language.set('en');
      return;
    }

    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('language') as Language | null;
      if (stored && (stored === 'en' || stored === 'uk')) {
        this.language.set(stored);
        return;
      }
    }

    // Determine default language from browser
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.toLowerCase();
      this.language.set(browserLang.startsWith('uk') ? 'uk' : 'en');
    } else {
      this.language.set('en');
    }
  }

  translate(key: string): string {
    const currentLang = this.language();
    const translations = this.translations.get(currentLang);

    if (!translations) {
      return key;
    }

    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  t(key: string): string {
    return this.translate(key);
  }
}
