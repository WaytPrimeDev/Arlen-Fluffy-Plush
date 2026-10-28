import { Injectable, REQUEST, inject, signal } from '@angular/core';

export type Language = 'en' | 'uk';

/** Every language the site is published in, and the order of its URL prefixes. */
export const LANGUAGES = ['uk', 'en'] as const satisfies readonly Language[];

/** Name of the cookie that remembers a choice, readable while rendering. */
export const LANGUAGE_COOKIE = 'language';

/**
 * Countries where the site speaks Ukrainian: Ukraine plus the other CIS
 * states, whose visitors are served Ukrainian rather than English.
 */
const UKRAINIAN_REGIONS = new Set([
  'UA',
  'RU',
  'BY',
  'KZ',
  'KG',
  'UZ',
  'TJ',
  'TM',
  'AM',
  'AZ',
  'MD',
  'GE',
]);

/** Languages spoken across those countries. */
const UKRAINIAN_LANGUAGES = new Set([
  'uk',
  'ru',
  'be',
  'kk',
  'ky',
  'uz',
  'tg',
  'tk',
  'hy',
  'az',
  'ka',
]);

export interface Translations {
  [key: string]: string | Translations;
}

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly language = signal<Language>('en');
  public readonly language$ = this.language.asReadonly();

  private translations = new Map<Language, Translations>();

  /** Present only while server-side rendering. */
  private readonly request = inject(REQUEST, { optional: true });

  constructor() {
    this.initializeTranslations();
    this.language.set(this.resolveInitialLanguage());
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
      filters: 'Filters',
      filtersActive: 'active filters',
      view: 'View',
      allKittens: 'All Available Kittens',
      byParents: 'By Families',
      filterByMother: 'Mother',
      filterByFather: 'Father',
      filterByGender: 'Gender',
      allMothers: 'All mothers',
      allFathers: 'All fathers',
      allGenders: 'All genders',
      resetAllFilters: 'Reset All Filters',
      litterFrom: 'Litter from',
      availableKittens: 'Available Kittens',
      noKittensMatchFilters: 'No kittens match your filters. Try adjusting your selection.',
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
      personalityPlaceholder:
        'A loving and curious kitten, raised in a family environment with daily socialization. Adapts well to new homes and bonds quickly with people.',
      healthInformation: 'Health Information',
      fullyVaccinated: 'Fully Vaccinated',
      healthCertified: 'Health Certified',
      healthDetailsPlaceholder:
        'All kittens are examined by a veterinarian, vaccinated by age, and treated against parasites before leaving the cattery.',
      mother: 'Mother',
      father: 'Father',
      interestedIn: 'Interested in',
      telegramCtaSubtext:
        "Contact us on Telegram for pricing and adoption details. We're happy to answer any questions.",
      contactOnTelegram: 'Contact us on Telegram',

      // Kittens page hero & tabs
      exploreOurKittens: 'Explore Our Kittens',
      exploreOurKittensSubtitle:
        'Find your perfect fluffy companion from our carefully bred kittens',
      availableKittensTab: 'Available Kittens',
      ourParentsTab: 'Our Parents',
      ourQueens: 'Our Queens',
      ourStuds: 'Our Studs',
      noParentsMatchFilter: 'No parents match your filter.',
      noParentsYet: 'No parents published yet',
      viewMode: 'View mode',

      // Kitten carousel
      kittenCarousel: 'carousel',
      scrollToPreviousKittens: 'Previous kittens',
      scrollToNextKittens: 'Next kittens',
      litters: 'Litters',
      loadingKittens: 'Loading kittens',
      filtersApplied: 'filters applied',
      notFoundTitle: 'This page does not exist',
      notFoundText:
        'The link may be out of date, or the kitten has already found a home. Try the kittens page.',
      meetOurKittens: 'Meet our',
      meetOurKittensHighlight: 'little princes and princesses',
      viewAllKittens: 'See all kittens',

      // Home page
      homeHeroTag: 'WCF cattery — with love since 2016',
      homeHeroTitleLead: 'A kitten is not',
      homeHeroTitleHighlight: 'just a pet.',
      homeHeroTitleTail: "It's family.",
      homeHeroDescription:
        'We raise kittens who become full members of the family — warming cold evenings, listening to your stories, and turning an apartment into a true home.',
      homeHeroImageAlt: 'Fluffy Ragdoll cat resting on a sunlit windowsill in a cosy living room',
      homeHeroPrimaryCta: 'Meet the kittens',
      homeHeroSecondaryCta: 'About the cattery',
      homeHeroPillTitle: 'All kittens are socialized',
      homeHeroPillText: 'Ready to move into a loving home',
      homePhilosophyEyebrow: 'Our philosophy',
      homePhilosophyTitleLead: 'A cat is an',
      homePhilosophyTitleHighlight: 'essential part',
      homePhilosophyTitleTail: 'of a modern family',
      homePhilosophyImageAlt: 'Woman holding a Ragdoll kitten in her arms at home',
      homePhilosophyP1:
        "Modern life is fast, noisy, and demanding. That's exactly why we need a cat. He doesn't demand explanations when you come home late. He just comes and lies down beside you.",
      homePhilosophyP2:
        "A cat knows when you're sad. He senses anxiety, chooses your lap, and turns even an empty new apartment into a truly cozy home.",
      homePhilosophyPoint1: 'Greets you at the door every day',
      homePhilosophyPoint2: 'Creates an atmosphere of comfort effortlessly',
      homePhilosophyPoint3: 'Hears you when no one else does',
      homeLifestyleEyebrow: 'Life with a cat',
      homeLifestyleTitle: 'Every moment is special',
      homeLifestyleSofaAlt: 'Ragdoll cat resting on a sofa',
      homeLifestyleSofaQuote: '«The sofa has never been so cozy»',
      homeLifestyleNightTitle: 'Night guardian',
      homeLifestyleNightText: "A cat's purring is the best sedative. Scientifically proven.",
      homeLifestyleFamilyAlt: 'A Ragdoll kitten in its owner’s arms',
      homeLifestyleCtaTitle: 'Ready to become a family?',
      homeLifestyleCtaText:
        "We'll help you pick the right kitten for your lifestyle — active or calm, for a large family or cozy solitude.",
      homeLifestyleCtaButton: 'See the kittens',
      homeWhyEyebrow: 'Why Arlen Fluffy Plush',
      homeWhyTitle: 'Kittens with a happiness guarantee',
      homeWhy1Title: 'Born at home',
      homeWhy1Text:
        'Kittens grow up in our apartment from day one — no cages, only warmth and care.',
      homeWhy2Title: '100% health',
      homeWhy2Text:
        'Veterinary certificates, vaccinations, microchipping, and genetic tests of the parents.',
      homeWhy3Title: 'Lifelong support',
      homeWhy3Text: 'We stay in touch — advising on nutrition, health, and upbringing.',
      homeWhy4Title: 'WCF documents',
      homeWhy4Text: 'International-standard pedigrees and metrics for every kitten.',
      homeReviewsEyebrow: 'Reviews',
      homeReviewsTitleLead: 'Families that have already',
      homeReviewsTitleHighlight: 'found their love',
      homeReview1Name: 'Anastasia M.',
      homeReview1City: 'Lviv',
      homeReview1Text:
        "We adopted Luna two years ago. Now we can't imagine our home without her. She greets us after work, sleeps with us, and knows everyone by name.",
      homeReview2Name: 'Dmytro K.',
      homeReview2City: 'Kharkiv',
      homeReview2Text:
        "My wife had to talk me into it for a long time. Now I can't live without our Graf. It's something more than a pet — it's a little personality.",
      homeReview3Name: 'Olha R.',
      homeReview3City: 'Vilnius',
      homeReview3Text:
        'A cattery with a soul. The kittens are healthy, socialized, and adapted instantly. They helped us pick the perfect one for our family.',
      homeContactEyebrow: 'Start the journey',
      homeContactTitleLead: 'Your home is waiting for its',
      homeContactTitleHighlight: 'fluffy family member',
      homeContactText:
        "Write to us — we'll tell you about available kittens, help with the choice, and answer any questions.",
      homeContactCta: 'Write on Telegram',

      // Shared fallbacks for records with missing fields
      fallbackNoName: 'Unnamed',
      fallbackNoBreed: 'Breed not specified',
      fallbackNoColor: 'Color not specified',
      fallbackNoAge: 'Age not specified',
      priceOnRequest: 'Price on request',

      // Age, abbreviated for badges
      ageDaysShort: 'd',
      ageWeeksShort: 'wk',
      ageMonthsShort: 'mo',
      ageYearsShort: 'y',

      // Parents page
      parentsEyebrow: 'Our cats',
      parentsSubtitle:
        'Meet our queens and studs — the pride of the cattery and the parents of every kitten here.',
      filterBySex: 'Filter by sex',
      showLabel: 'Show',
      kittensWord: 'kittens',
      loadErrorTitle: 'Could not load',
      nothingFoundTitle: 'Nobody found',
      nothingFoundText: 'Try a different filter.',
      moreAbout: 'More about',

      // Blog page
      blogEyebrow: 'Cattery blog',
      blogTitle: 'Useful reading about cats',
      blogSubtitle: 'Advice from specialists, care guides and curious facts about cats',
      blogReadMore: 'Read the full article',
      blogFeaturedTitle: 'Popular articles',
      blogNewsletterTitle: 'Get tips and news',
      blogNewsletterText: 'Subscribe to our newsletter and keep up with everything at the cattery',
      blogEmailPlaceholder: 'Enter your email',
      blogSubscribe: 'Subscribe',
      blogCatTips: 'Advice',
      blogCatCare: 'Care',
      blogCatBreeds: 'Breeds',
      blogCatNutrition: 'Nutrition',
      blogCatHealth: 'Health',
      blogPost1Title: 'How to choose the perfect British kitten',
      blogPost1Excerpt: 'Advice for first-time owners on picking a healthy, friendly kitten',
      blogPost2Title: 'Caring for long-haired cats',
      blogPost2Excerpt: 'A complete guide to the coat of your fluffy friends',
      blogPost3Title: 'The temperament of British cats',
      blogPost3Excerpt: 'Find out why British cats are so special and so unlike any other',
      blogPost4Title: 'Feeding a kitten: health from the first days',
      blogPost4Excerpt: 'How to feed a kitten for healthy growth and development',
      blogPost5Title: 'Settling a kitten into a new home',
      blogPost5Excerpt: 'A step-by-step guide to a stress-free move',
      blogPost6Title: 'Cat health: prevention and vaccination',
      blogPost6Excerpt: 'What you need to know about keeping your pet well',
      blogAuthor1: 'Olha',
      blogAuthor2: 'Masha',
      blogAuthor3: 'Dmytro',

      // Header
      premiumKittens: 'Premium Kittens',
      aboutUs: 'About Us',
      contacts: 'Contacts',

      // Footer
      footerAbout:
        'Breeding exceptional fluffy kittens with love and dedication.',
      quickLinks: 'Quick Links',
      ourStory: 'Our Story',
      contactUs: 'Contact Us',
      connectWithUs: 'Connect With Us',
      allRightsReserved: 'All rights reserved.',
      madeWith: 'Made with',
      forFluffyFriends: 'for fluffy friends',

      // About page
      aboutHeroTitle: 'Our Story',
      aboutHeroSubtitle:
        'A journey of passion, dedication, and love for exceptional fluffy kittens',
      aboutIntroTitle: 'Breeding Excellence Since 2010',
      aboutIntroP1:
        'Our story began back in 2010, when the first Scottish Straight cat appeared in our home. She is where our great love, our fascination and our professional path in the world of cats were born.',
      aboutIntroP2:
        'Since September 2016 we have been officially registered as a cattery with the World Cat Federation (WCF) under the name Arlen Fluffy Plush. In 2021 we discovered the wonderful Ragdoll breed, and since then working with these royal cats has been the main focus of our cattery. Today we work with several breeds, but the Ragdolls remain our heart.',
      aboutIntroP3:
        'For our family this is not just a favourite pursuit — it is part of our life. The birth of every new litter of kittens is a true celebration for us, one we await with great excitement and impatience.',
      aboutIntroImageAlt: 'A bright cattery room with a cat tree, wall shelves and beds, where Ragdoll cats play on a rug',
      coreValues: 'Our Core Values',
      valueLoveTitle: 'Love & Care',
      valueLoveDesc:
        'We sincerely love every one of our cats and surround them with daily care, attention and warmth — and they answer us with boundless affection and purring.',
      valueExcellenceTitle: 'Excellence',
      valueExcellenceDesc:
        'We hold to the highest standards in breeding, focusing on health, temperament and breed characteristics.',
      valueIntegrityTitle: 'Breed standard',
      valueIntegrityDesc:
        'Our kittens are not only beautiful — they match the high standard and come with an official pedigree.',
      ourJourney: 'Our Journey',
      milestone2010Title: 'The first cat in our home',
      milestone2010Desc:
        'Our first Scottish Straight cat appeared in our home — the beginning of our great love for cats and of our professional path.',
      milestone2013Title: 'Our first international show',
      milestone2013Desc:
        'We stepped into the international ring for the first time. An independent panel of judges confirmed that our cats match the international breed standard.',
      milestone2015Title: 'Working with colour',
      milestone2015Desc:
        'We moved from simply breeding to selection by colour, beginning focused work on the silver lines, where the sharpness and contrast of the pattern is what counts.',
      milestone2016Title: 'WCF registration',
      milestone2016Desc:
        'In September 2016 we were officially registered as a cattery with the World Cat Federation (WCF) under the name Arlen Fluffy Plush.',
      milestone2019Title: 'New horizons: the golden colour',
      milestone2019Desc:
        'The British breed joined the cattery, and with it our most demanding direction — the golden colour, which takes years of patient selection.',
      milestone2021Title: 'Discovering the Ragdoll',
      milestone2021Desc:
        'We discovered the wonderful Ragdoll breed, and since then these royal cats have been the main — though not the only — focus of our cattery.',
      readinessTitle: 'What a kitten comes with',
      readiness1Title: 'Socialization from the first days',
      readiness1Desc:
        'From birth the little ones get used to people, to the sounds of the house and to being petted, so they grow up very sociable, hand-raised and trusting.',
      readiness2Title: 'Health and protection',
      readiness2Desc:
        'Kittens move to their new families fully vaccinated and microchipped.',
      readiness3Title: 'Official set of documents',
      readiness3Desc:
        'Together with the kitten you receive a complete set: a pedigree, a club transfer and an veterinary passport.',
      readiness4Title: 'A member of the family',
      readiness4Desc:
        'Our kittens become loyal, gentle members of the family who will bring a sea of joy into your home.',

      // Contacts page
      connectWithUsHero: 'Connect With Us',
      connectWithUsSubtitle:
        "We'd love to hear from you! Reach out with any questions about our kittens.",
      contactInformation: 'Contact Information',
      contactEmail: 'Email',
      contactPhone: 'Phone',
      contactLocation: 'Location',
      followUs: 'Follow Us',
      ourPartners: 'Our Partners',
      ourPartnersSubtitle:
        'We are proud members of these prestigious cat associations, committed to upholding the highest standards in breeding and cat welfare.',

      // Filter chips
      activeFilters: 'Active filters',
      removeFilter: 'Remove filter',

      // Header menu
      skipToContent: 'Skip to content',
      navMain: 'Main menu',
      navMobile: 'Mobile menu',
      menu: 'Open menu',
      close: 'Close menu',

      // Photo viewer
      viewerClose: 'Close gallery',
      viewerPrev: 'Previous image',
      viewerNext: 'Next image',
      viewerCounter: '{current} / {total}',
      viewerImageAlt: '{label} — photo {index}',
      viewerGoToImage: 'Go to image {index}',
      viewerZoom: 'Zoom in or out',
      viewerError: 'The image could not be loaded.',
      photo: 'Photo',
      openPhotoFullscreen: 'Open photo full screen',
      galleryThumbnails: 'Photo thumbnails',

      // Kitten fallbacks
      kittenFallbackName: 'Kitten',
      kittenLoadError: 'Failed to load kitten data.',

      // Home page — contact labels
      homeContactTelegramLabel: 'Telegram',
      homeContactWhatsappLabel: 'WhatsApp',
      homeContactEmailLabel: 'Email',
    });

    this.translations.set('uk', {
      // Navigation
      home: 'Головна',
      parents: 'Батьки',
      kittens: 'Кошенята',
      families: 'Сім’ї',
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
      familiesTitle: 'Сім’ї кошенят',
      familiesDescription: 'Наші сім’ї кошенят та їхня спадщина',
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
      filters: 'Фільтри',
      filtersActive: 'активних фільтрів',
      view: 'Вигляд',
      allKittens: 'Усі доступні кошенята',
      byParents: 'За сім’ями',
      filterByMother: 'Мама',
      filterByFather: 'Тато',
      filterByGender: 'Стать',
      allMothers: 'Усі мами',
      allFathers: 'Усі тата',
      allGenders: 'Усі статі',
      resetAllFilters: 'Скинути всі фільтри',
      litterFrom: 'Від',
      availableKittens: 'Доступні кошенята',
      noKittensMatchFilters: 'Жодне кошеня не відповідає фільтрам. Спробуйте змінити вибір.',
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
      personalityPlaceholder:
        'Лагідне та допитливе кошеня, виховане в родинній атмосфері з щоденною соціалізацією. Швидко звикає до нового дому та прив’язується до людей.',
      healthInformation: 'Здоров’я',
      fullyVaccinated: 'Повністю вакциновано',
      healthCertified: 'Сертифікат здоров’я',
      healthDetailsPlaceholder:
        'Усі кошенята оглянуті ветеринаром, вакциновані за віком та оброблені від паразитів перед переїздом.',
      mother: 'Мама',
      father: 'Тато',
      interestedIn: 'Зацікавилися',
      telegramCtaSubtext:
        'Напишіть нам у Telegram, щоб дізнатися ціну та деталі. Ми залюбки відповімо на всі запитання.',
      contactOnTelegram: 'Написати в Telegram',

      // Kittens page hero & tabs
      exploreOurKittens: 'Наші кошенята',
      exploreOurKittensSubtitle:
        'Знайдіть ідеального пухнастого друга з-поміж наших дбайливо вирощених кошенят',
      availableKittensTab: 'Доступні кошенята',
      ourParentsTab: 'Наші батьки',
      ourQueens: 'Наші мами',
      ourStuds: 'Наші тата',
      noParentsMatchFilter: 'Немає батьків, що відповідають фільтру.',
      noParentsYet: 'Поки що без батьків',
      viewMode: 'Режим перегляду',

      // Kitten carousel
      kittenCarousel: 'карусель',
      scrollToPreviousKittens: 'Попередні кошенята',
      scrollToNextKittens: 'Наступні кошенята',
      litters: 'Послідів',
      loadingKittens: 'Завантажуємо кошенят',
      filtersApplied: 'фільтрів активно',
      notFoundTitle: 'Такої сторінки не існує',
      notFoundText:
        'Можливо, посилання застаріло або кошеня вже знайшло дім. Спробуйте сторінку кошенят.',
      meetOurKittens: 'Познайомтеся з нашими',
      meetOurKittensHighlight: 'маленькими принцами й принцесами',
      viewAllKittens: 'Дивитися всіх кошенят',

      // Home page
      homeHeroTag: 'Розплідник WCF — з любов’ю з 2016 року',
      homeHeroTitleLead: 'Кошеня — це',
      homeHeroTitleHighlight: 'не просто улюбленець.',
      homeHeroTitleTail: 'Це родина.',
      homeHeroDescription:
        'Ми вирощуємо кошенят, які стають повноправними членами родини — гріють холодні вечори, слухають ваші історії й перетворюють квартиру на справжній дім.',
      homeHeroImageAlt: 'Пухнастий кіт рагдол відпочиває на сонячному підвіконні у затишній вітальні',
      homeHeroPrimaryCta: 'Познайомитись із кошенятами',
      homeHeroSecondaryCta: 'Про розплідник',
      homeHeroPillTitle: 'Усі кошенята соціалізовані',
      homeHeroPillText: 'Готові переїхати в люблячий дім',
      homePhilosophyEyebrow: 'Наша філософія',
      homePhilosophyTitleLead: 'Кіт —',
      homePhilosophyTitleHighlight: 'невід’ємна частина',
      homePhilosophyTitleTail: 'сучасної родини',
      homePhilosophyImageAlt: 'Жінка тримає на руках кошеня рагдола вдома',
      homePhilosophyP1:
        'Сучасне життя — швидке, гучне, вимогливе. І саме тому нам потрібен кіт. Він не вимагає пояснень, коли ви повернулися пізно. Він просто приходить і лягає поряд.',
      homePhilosophyP2:
        'Кіт знає, коли вам сумно. Він відчуває тривогу, обирає саме ваші коліна й перетворює навіть порожню нову квартиру на справжній затишний дім.',
      homePhilosophyPoint1: 'Зустрічає біля дверей щодня',
      homePhilosophyPoint2: 'Створює атмосферу затишку без зусиль',
      homePhilosophyPoint3: 'Чує вас, коли ніхто інший не чує',
      homeLifestyleEyebrow: 'Життя з котом',
      homeLifestyleTitle: 'Кожна мить — особлива',
      homeLifestyleSofaAlt: 'Кіт рагдол відпочиває на дивані',
      homeLifestyleSofaQuote: '«Диван ніколи не був таким затишним»',
      homeLifestyleNightTitle: 'Нічний охоронець',
      homeLifestyleNightText: 'Муркотіння кота — найкращий заспокійливий засіб. Науково доведено.',
      homeLifestyleFamilyAlt: 'Кошеня рагдола на руках у власниці',
      homeLifestyleCtaTitle: 'Готові стати родиною?',
      homeLifestyleCtaText:
        'Ми допоможемо підібрати кошеня саме під ваш спосіб життя — активне чи спокійне, для великої родини чи затишної самотності.',
      homeLifestyleCtaButton: 'Дивитися кошенят',
      homeWhyEyebrow: 'Чому Arlen Fluffy Plush',
      homeWhyTitle: 'Кошенята з гарантією щастя',
      homeWhy1Title: 'Народжені вдома',
      homeWhy1Text:
        'Кошенята ростуть у квартирі з першого дня — жодних кліток, лише тепло і турбота.',
      homeWhy2Title: 'Здоров’я на 100%',
      homeWhy2Text: 'Ветеринарні довідки, щеплення, чипування та генетичні тести батьків.',
      homeWhy3Title: 'Підтримка назавжди',
      homeWhy3Text:
        'Ми залишаємося на зв’язку — консультуємо щодо харчування, здоров’я і виховання.',
      homeWhy4Title: 'Документи WCF',
      homeWhy4Text: 'Метрики та родоводи міжнародного стандарту для кожного кошеняти.',
      homeReviewsEyebrow: 'Відгуки',
      homeReviewsTitleLead: 'Родини, які вже',
      homeReviewsTitleHighlight: 'знайшли свою любов',
      homeReview1Name: 'Анастасія М.',
      homeReview1City: 'Львів',
      homeReview1Text:
        'Узяли Луну два роки тому. Тепер без неї неможливо уявити наш дім. Вона зустрічає нас з роботи, спить з нами і знає кожного на ім’я.',
      homeReview2Name: 'Дмитро К.',
      homeReview2City: 'Харків',
      homeReview2Text:
        'Спочатку дружина довго вмовляла. Тепер я сам не можу без нашого Графа. Це щось більше, ніж улюбленець — це маленька особистість.',
      homeReview3Name: 'Ольга Р.',
      homeReview3City: 'Вільнюс',
      homeReview3Text:
        'Розплідник із душею. Кошенята здорові, соціалізовані, одразу адаптувалися. Допомогли обрати саме того, хто підходить нашій родині.',
      homeContactEyebrow: 'Розпочніть подорож',
      homeContactTitleLead: 'Ваш дім чекає свого',
      homeContactTitleHighlight: 'пухнастого члена родини',
      homeContactText:
        'Напишіть нам — ми розповімо про вільних кошенят, допоможемо з вибором і відповімо на будь-які запитання.',
      homeContactCta: 'Написати в Telegram',

      // Shared fallbacks for records with missing fields
      fallbackNoName: 'Без імені',
      fallbackNoBreed: 'Порода не вказана',
      fallbackNoColor: 'Колір не вказано',
      fallbackNoAge: 'Вік не вказано',
      priceOnRequest: 'Ціна за запитом',

      // Age, abbreviated for badges
      ageDaysShort: 'дн.',
      ageWeeksShort: 'тиж.',
      ageMonthsShort: 'міс.',
      ageYearsShort: 'р.',

      // Parents page
      parentsEyebrow: 'Наші улюбленці',
      parentsSubtitle:
        'Познайомтеся з нашими кішками та котами — гордістю розплідника й батьками всіх малюків.',
      filterBySex: 'Фільтрація за статтю',
      showLabel: 'Показати',
      kittensWord: 'кошенят',
      loadErrorTitle: 'Помилка завантаження',
      nothingFoundTitle: 'Нікого не знайдено',
      nothingFoundText: 'Спробуйте вибрати інший фільтр.',
      moreAbout: 'Детальніше про',

      // Blog page
      blogEyebrow: 'Блог розплідника',
      blogTitle: 'Корисне про котів',
      blogSubtitle: 'Поради від фахівців, статті про догляд та цікаві факти про котів',
      blogReadMore: 'Читати повністю',
      blogFeaturedTitle: 'Популярні статті',
      blogNewsletterTitle: 'Отримуйте поради та новини',
      blogNewsletterText: 'Підпишіться на нашу розсилку й будьте в курсі всіх новин розплідника',
      blogEmailPlaceholder: 'Введіть вашу електронну пошту',
      blogSubscribe: 'Підписатися',
      blogCatTips: 'Поради',
      blogCatCare: 'Догляд',
      blogCatBreeds: 'Породи',
      blogCatNutrition: 'Харчування',
      blogCatHealth: 'Здоров’я',
      blogPost1Title: 'Як обрати ідеальне британське кошеня',
      blogPost1Excerpt: 'Поради новачкам щодо вибору здорового та дружнього кошеняти',
      blogPost2Title: 'Догляд за довгою шерстю котів',
      blogPost2Excerpt: 'Повний посібник із догляду за шерстю ваших пухнастих друзів',
      blogPost3Title: 'Особливості характеру британських котів',
      blogPost3Excerpt: 'Дізнайтеся, чому британські коти такі особливі та неповторні',
      blogPost4Title: 'Харчування кошеняти: здоров’я з перших днів',
      blogPost4Excerpt: 'Як правильно годувати кошеня для його здоров’я та розвитку',
      blogPost5Title: 'Адаптація кошеняти в новому домі',
      blogPost5Excerpt: 'Покроковий посібник для адаптації без стресу',
      blogPost6Title: 'Здоров’я котів: профілактика та вакцинація',
      blogPost6Excerpt: 'Важлива інформація про профілактичні заходи для вашого улюбленця',
      blogAuthor1: 'Ольга',
      blogAuthor2: 'Маша',
      blogAuthor3: 'Дмитро',

      // Header
      premiumKittens: 'Преміум кошенята',
      aboutUs: 'Про нас',
      contacts: 'Контакти',

      // Footer
      footerAbout:
        'Розводимо виняткових пухнастих кошенят із любов’ю та відданістю.',
      quickLinks: 'Швидкі посилання',
      ourStory: 'Наша історія',
      contactUs: 'Зв’язатися з нами',
      connectWithUs: 'Зв’язок з нами',
      allRightsReserved: 'Усі права захищені.',
      madeWith: 'Зроблено з',
      forFluffyFriends: 'для пухнастих друзів',

      // About page
      aboutHeroTitle: 'Наша історія',
      aboutHeroSubtitle:
        'Подорож пристрасті, відданості та любові до виняткових пухнастих кошенят',
      aboutIntroTitle: 'Досконалість у розведенні з 2010 року',
      aboutIntroP1:
        'Наша історія розпочалася ще у 2010 році, коли в нашому домі з’явилася перша шотландська прямовуха кішка. Саме з неї зародилася наша велика любов, захоплення та професійний шлях у світі котів.',
      aboutIntroP2:
        'З вересня 2016 року ми офіційно зареєстровані як розплідник у Всесвітній федерації котів (WCF) під назвою Arlen Fluffy Plush. У 2021 році ми відкрили для себе дивовижну породу регдол, і з того часу робота з цими королівськими котами стала основним напрямком нашого розплідника. Сьогодні ми працюємо з кількома породами, але регдоли залишаються головними.',
      aboutIntroP3:
        'Для нашої родини це не просто улюблена справа — це частина нашого життя. Народження кожного нового помету кошенят для нас — це справжнє свято, на яке ми чекаємо з великим трепетом і нетерпінням.',
      aboutIntroImageAlt: 'Світла кімната розплідника з ігровим комплексом, полицями та лежанками, де на килимі граються коти рагдол',
      coreValues: 'Наші цінності',
      valueLoveTitle: 'Любов та турбота',
      valueLoveDesc:
        'Ми щиро любимо кожного нашого вихованця, оточуємо їх щоденною турботою, увагою та теплом — а вони відповідають нам безмежною взаємністю та муркотінням.',
      valueExcellenceTitle: 'Досконалість',
      valueExcellenceDesc:
        'Ми підтримуємо найвищі стандарти в розведенні, зосереджуючись на здоров’ї, темпераменті та характеристиках породи.',
      valueIntegrityTitle: 'Стандарт породи',
      valueIntegrityDesc:
        'Наші кошенята — це не лише краса, а й відповідність високим стандартам породи та офіційний родовід.',
      ourJourney: 'Наш шлях',
      milestone2010Title: 'Перша кішка в нашому домі',
      milestone2010Desc:
        'У нашому домі з’явилася перша шотландська прямовуха кішка — початок нашої великої любові до котів і професійного шляху.',
      milestone2013Title: 'Перша міжнародна виставка',
      milestone2013Desc:
        'Ми вперше вийшли на міжнародний ринг. Незалежна оцінка експертів підтвердила, що наші тварини відповідають міжнародному стандарту породи.',
      milestone2015Title: 'Робота з забарвленням',
      milestone2015Desc:
        'Ми перейшли від простого розведення до селекції за окрасом — почалася цілеспрямована робота зі срібними лініями, де цінується чіткість і контраст малюнка.',
      milestone2016Title: 'Реєстрація у WCF',
      milestone2016Desc:
        'У вересні 2016 року ми офіційно зареєстровані як розплідник у Всесвітній федерації котів (WCF) під назвою Arlen Fluffy Plush.',
      milestone2019Title: 'Нові горизонти: золоте забарвлення',
      milestone2019Desc:
        'У розпліднику з’явилася британська порода, а разом з нею найскладніший напрямок — золоте забарвлення, яке вимагає років кропіткої селекції.',
      milestone2021Title: 'Відкриття породи регдол',
      milestone2021Desc:
        'Ми відкрили для себе дивовижну породу регдол, і з того часу ці королівські коти стали основним — хоча й не єдиним — напрямком розплідника.',
      readinessTitle: 'З чим кошеня переїжджає до вас',
      readiness1Title: 'Соціалізація з перших днів',
      readiness1Desc:
        'Малюки від народження звикають до людей, шуму оселі та ласки, тому виростають дуже контактними, ручними та довірливими.',
      readiness2Title: 'Здоров’я та захист',
      readiness2Desc: 'До нових родин малюки переїжджають повністю вакцинованими та чіпованими.',
      readiness3Title: 'Офіційний пакет документів',
      readiness3Desc:
        'Разом із кошеням ви отримуєте повний комплект: родословну, клубний трансфер та ветеринарний паспорт.',
      readiness4Title: 'Член родини',
      readiness4Desc:
        'Наші кошенята стають вірними, ніжними членами сім’ї, які принесуть у ваш дім море радості.',

      // Contacts page
      connectWithUsHero: 'Зв’язок з нами',
      connectWithUsSubtitle:
        'Ми будемо раді почути від вас! Звертайтеся з будь-якими питаннями про наших кошенят.',
      contactInformation: 'Контактна інформація',
      contactEmail: 'Електронна пошта',
      contactPhone: 'Телефон',
      contactLocation: 'Локація',
      followUs: 'Підписуйтесь',
      ourPartners: 'Наші партнери',
      ourPartnersSubtitle:
        'Ми пишаємося членством у цих престижних кошачих асоціаціях, які підтримують найвищі стандарти розведення та благополуччя котів.',

      // Filter chips
      activeFilters: 'Активні фільтри',
      removeFilter: 'Прибрати фільтр',

      // Header menu
      skipToContent: 'Перейти до вмісту',
      navMain: 'Головне меню',
      navMobile: 'Мобільне меню',
      menu: 'Відкрити меню',
      close: 'Закрити меню',

      // Photo viewer
      viewerClose: 'Закрити галерею',
      viewerPrev: 'Попереднє фото',
      viewerNext: 'Наступне фото',
      viewerCounter: '{current} / {total}',
      viewerImageAlt: '{label} — фото {index}',
      viewerGoToImage: 'Перейти до фото {index}',
      viewerZoom: 'Збільшити або зменшити',
      viewerError: 'Не вдалося завантажити фото.',
      photo: 'Фото',
      openPhotoFullscreen: 'Відкрити фото на весь екран',
      galleryThumbnails: 'Мініатюри фото',

      // Kitten fallbacks
      kittenFallbackName: 'Кошеня',
      kittenLoadError: 'Не вдалося завантажити дані про кошеня.',

      // Home page — contact labels
      homeContactTelegramLabel: 'Telegram',
      homeContactWhatsappLabel: 'WhatsApp',
      homeContactEmailLabel: 'Email',
    });
  }

  setLanguage(lang: Language) {
    this.language.set(lang);
    this.rememberLanguage(lang);
  }

  /**
   * Persists the choice twice: `localStorage` for the browser and a cookie,
   * because only the cookie reaches the server, which needs it to redirect a
   * prefix-less URL to the language this visitor already picked.
   */
  private rememberLanguage(lang: Language): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LANGUAGE_COOKIE, lang);
      }
    } catch {
      // Blocked storage is not an error here.
    }

    if (typeof document !== 'undefined') {
      const oneYear = 60 * 60 * 24 * 365;
      document.cookie = `${LANGUAGE_COOKIE}=${lang};path=/;max-age=${oneYear};samesite=lax`;
    }
  }

  getLanguage(): Language {
    return this.language();
  }

  /**
   * Picks the language for the very first render.
   *
   * Order matters: an explicit `?lang=` wins so a link can pin a language, then
   * the visitor's own earlier choice, then where they are coming from. The last
   * step is what makes the Google snippet Ukrainian for Ukraine and the other
   * CIS countries and English everywhere else, because during server-side
   * rendering `Accept-Language` is the only signal available.
   */
  private resolveInitialLanguage(): Language {
    return (
      this.languageFromPath() ??
      this.languageFromQuery() ??
      this.languageFromStorage() ??
      this.languageFromCookie() ??
      this.languageFromAcceptedLocales() ??
      'en'
    );
  }

  /**
   * The language prefix of the URL being rendered. This is the authoritative
   * source once a page is open: `/uk/kittens` is the Ukrainian page no matter
   * what the visitor's browser or earlier choice says.
   */
  private languageFromPath(): Language | null {
    return languageFromPathname(this.currentUrl()?.pathname ?? '');
  }

  private languageFromCookie(): Language | null {
    const header = this.request?.headers.get('cookie') ?? readDocumentCookie();
    if (!header) {
      return null;
    }

    for (const part of header.split(';')) {
      const [name, ...rest] = part.split('=');
      if (name.trim() !== LANGUAGE_COOKIE) {
        continue;
      }

      const value = rest.join('=').trim();
      return value === 'uk' || value === 'en' ? value : null;
    }

    return null;
  }

  private languageFromQuery(): Language | null {
    const url = this.currentUrl();
    if (!url) {
      return null;
    }

    const requested = url.searchParams.get('lang');
    return requested === 'uk' || requested === 'en' ? requested : null;
  }

  private languageFromStorage(): Language | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const stored = localStorage.getItem('language');
      return stored === 'uk' || stored === 'en' ? stored : null;
    } catch {
      // Blocked storage (private mode, disabled cookies) is not an error here.
      return null;
    }
  }

  /**
   * Reads `Accept-Language` while rendering on the server and the navigator's
   * locales in the browser, then maps the best match onto a site language.
   */
  private languageFromAcceptedLocales(): Language | null {
    const tags = this.request
      ? parseAcceptLanguage(this.request.headers.get('accept-language'))
      : navigatorLocales();

    for (const tag of tags) {
      const matched = languageForLocale(tag);
      if (matched) {
        return matched;
      }
    }

    return null;
  }

  private currentUrl(): URL | null {
    const href = this.request?.url ?? (typeof location === 'undefined' ? null : location.href);
    return href && URL.canParse(href) ? new URL(href) : null;
  }

  /**
   * `params` fills the `{name}` placeholders a phrase declares, so the order
   * of its parts belongs to the translation rather than to the template that
   * renders it - word order differs between the two languages.
   */
  translate(key: string, params?: Readonly<Record<string, string | number>>): string {
    const currentLang = this.language();
    const translations = this.translations.get(currentLang);

    if (!translations) {
      return key;
    }

    const keys = key.split('.');
    let value: string | Translations | undefined = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    return params ? fillPlaceholders(value, params) : value;
  }

  t(key: string, params?: Readonly<Record<string, string | number>>): string {
    return this.translate(key, params);
  }
}

/** Replaces every `{name}` a phrase declares with the value given for it. */
function fillPlaceholders(
  phrase: string,
  params: Readonly<Record<string, string | number>>,
): string {
  return phrase.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** Splits an `Accept-Language` header into locale tags, best match first. */
function parseAcceptLanguage(header: string | null): string[] {
  if (!header) {
    return [];
  }

  return header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const quality = params
        .map((param) => /^\s*q=([\d.]+)\s*$/.exec(param))
        .find((match) => match !== null);

      return { tag: tag.trim(), quality: quality ? Number(quality[1]) : 1 };
    })
    .filter((entry) => entry.tag.length > 0 && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality)
    .map((entry) => entry.tag);
}

function navigatorLocales(): string[] {
  if (typeof navigator === 'undefined') {
    return [];
  }

  return navigator.languages?.length ? [...navigator.languages] : [navigator.language];
}

/**
 * `uk` when the locale points at Ukraine or another CIS country — by region
 * first, since a visitor in Ukraine browsing in English still belongs there —
 * then by language. `null` means "no opinion", so the next signal is tried.
 */
function languageForLocale(tag: string): Language | null {
  if (tag === '*') {
    return null;
  }

  const [language, ...subtags] = tag.toLowerCase().split('-');
  const region = subtags.find((subtag) => subtag.length === 2)?.toUpperCase();

  if (region && UKRAINIAN_REGIONS.has(region)) {
    return 'uk';
  }

  if (UKRAINIAN_LANGUAGES.has(language)) {
    return 'uk';
  }

  return language === 'en' || region ? 'en' : null;
}

function readDocumentCookie(): string | null {
  return typeof document === 'undefined' ? null : document.cookie;
}

/** Reads the leading `/uk` or `/en` of a pathname. */
export function languageFromPathname(pathname: string): Language | null {
  const [first] = pathname.replace(/^\/+/, '').split('/');
  return LANGUAGES.find((language) => language === first) ?? null;
}

/** Drops the language prefix, returning the path shared by both languages. */
export function stripLanguagePrefix(pathname: string): string {
  const language = languageFromPathname(pathname);
  if (!language) {
    return pathname || '/';
  }

  const rest = pathname.replace(/^\/+/, '').slice(language.length);
  return rest.startsWith('/') ? rest : `/${rest}`;
}

/** Builds the URL of `path` (given without a prefix) in `language`. */
export function localizedPath(language: Language, path: string): string {
  const clean = path.replace(/^\/+/, '');
  return clean ? `/${language}/${clean}` : `/${language}`;
}
