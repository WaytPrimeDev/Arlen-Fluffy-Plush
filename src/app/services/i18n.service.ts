import { Injectable, signal } from '@angular/core';

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

  private translations = new Map<Language, Translations>();

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
      byParents: 'By Families',
      filterByMother: 'Mother',
      filterByFather: 'Father',
      filterByGender: 'Gender',
      allMothers: 'All mothers',
      allFathers: 'All fathers',
      allGenders: 'All genders',
      resetAllFilters: 'Reset All Filters',
      activeFilters: 'Active filters',
      removeFilter: 'Remove filter',
      litterFrom: 'Litter from',
      availableKittens: 'Available Kittens',
      noKittensMatchFilters:
        'No kittens match your filters. Try adjusting your selection.',
      viewDetails: 'View Details',

      // Display fallbacks & age
      kittenFallbackName: 'Kitten',
      noName: 'Unnamed',
      breedNotSpecified: 'Breed not specified',
      colorNotSpecified: 'Color not specified',
      ageNotSpecified: 'Age not specified',
      priceOnRequest: 'Price on request',
      kittenLoadError: 'Failed to load kitten data.',
      ageMonthsShort: 'mo',
      ageDaysShort: 'd',
      carouselPrev: 'Previous kittens',
      carouselNext: 'Next kittens',

      // Photo viewer
      viewerClose: 'Close gallery',
      viewerPrev: 'Previous image',
      viewerNext: 'Next image',
      viewerCounter: '{current} / {total}',
      viewerImageAlt: '{label} — photo {index}',
      viewerGoToImage: 'Go to image {index}',

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
      menu: 'Open menu',
      close: 'Close menu',

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

      // Home page — hero
      homeHeroTag: 'WCF cattery — with love since 2014',
      homeHeroTitle1: 'A kitten is not',
      homeHeroTitle2: 'just a pet.',
      homeHeroTitle3: 'It\'s family.',
      homeHeroDescription: 'We raise kittens who become full members of the family — warming cold evenings, listening to your stories, and turning an apartment into a true home.',
      homeHeroCtaPrimary: 'Meet the kittens →',
      homeHeroCtaSecondary: 'About the cattery',
      homeHeroPillTitle: 'All kittens are socialized',
      homeHeroPillText: 'Ready to move into a loving home',

      // Home page — philosophy
      homePhilosophyEyebrow: 'Our philosophy',
      homePhilosophyTitle1: 'A cat is an',
      homePhilosophyTitle2: 'essential part',
      homePhilosophyTitle3: 'of a modern home',
      homePhilosophyParagraph1: 'Modern life is fast, noisy, and demanding. That\'s exactly why we need a cat. He doesn\'t demand explanations when you come home late. He just comes and lies down beside you.',
      homePhilosophyParagraph2: 'A cat knows when you\'re sad. He senses anxiety, chooses your lap, and turns even an empty new apartment into a truly cozy home.',
      homePhilosophyPoint1: 'Greets you at the door every day',
      homePhilosophyPoint2: 'Creates an atmosphere of comfort effortlessly',
      homePhilosophyPoint3: 'Hears you when no one else does',

      // Home page — lifestyle / bento
      homeLifestyleEyebrow: 'Life with a cat',
      homeLifestyleTitle: 'Every moment is special',
      homeBentoSofaQuote: '«The sofa has never been so cozy»',
      homeBentoMoonTitle: 'Night guardian',
      homeBentoMoonText: 'A cat\'s purring is the best sedative. Scientifically proven.',
      homeBentoCtaTitle: 'Ready to become a family?',
      homeBentoCtaText: 'We\'ll help you pick the right kitten for your lifestyle — active or calm, for a large family or cozy solitude.',
      homeBentoCtaButton: 'See the kittens →',

      // Home page — kittens block
      homeKittensEyebrow: 'Available kittens',
      homeKittensTitle1: 'Meet our',
      homeKittensTitle2: 'little princes and princesses',
      homeKittensSeeAll: 'See all kittens →',

      // Home page — why
      homeWhyEyebrow: 'Why Arlen Fluffy Plush',
      homeWhyTitle: 'Kittens with a happiness guarantee',
      homeWhy1Title: 'Born at home',
      homeWhy1Text: 'Kittens grow up in our apartment from day one — no cages, only warmth and care.',
      homeWhy2Title: '100% health',
      homeWhy2Text: 'Veterinary certificates, vaccinations, microchipping, and genetic tests of the parents.',
      homeWhy3Title: 'Lifelong support',
      homeWhy3Text: 'We stay in touch — advising on nutrition, health, and upbringing.',
      homeWhy4Title: 'WCF documents',
      homeWhy4Text: 'International-standard pedigrees and metrics for every kitten.',

      // Home page — reviews
      homeReviewsEyebrow: 'Reviews',
      homeReviewsTitle1: 'Families that have already',
      homeReviewsTitle2: 'found their love',
      homeReview1Name: 'Anastasia M.',
      homeReview1City: 'Lviv',
      homeReview1Text: 'We adopted Luna two years ago. Now we can\'t imagine our home without her. She greets us after work, sleeps with us, and knows everyone by name.',
      homeReview2Name: 'Dmytro K.',
      homeReview2City: 'Kharkiv',
      homeReview2Text: 'My wife had to talk me into it for a long time. Now I can\'t live without our Graf. It\'s something more than a pet — it\'s a little personality.',
      homeReview3Name: 'Olha R.',
      homeReview3City: 'Vilnius',
      homeReview3Text: 'A cattery with a soul. The kittens are healthy, socialized, and adapted instantly. They helped us pick the perfect one for our family.',

      // Home page — contact
      homeContactEyebrow: 'Start the journey',
      homeContactTitle1: 'Your home is waiting for its',
      homeContactTitle2: 'fluffy family member',
      homeContactDescription: 'Write to us — we\'ll tell you about available kittens, help with the choice, and answer any questions.',
      homeContactTelegramLabel: 'Telegram',
      homeContactWhatsappLabel: 'WhatsApp',
      homeContactEmailLabel: 'Email',
      homeContactCta: 'Write on Telegram →',
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
      byParents: 'За сім\'ями',
      filterByMother: 'Мама',
      filterByFather: 'Тато',
      filterByGender: 'Стать',
      allMothers: 'Усі мами',
      allFathers: 'Усі тата',
      allGenders: 'Усі статі',
      resetAllFilters: 'Скинути всі фільтри',
      activeFilters: 'Активні фільтри',
      removeFilter: 'Прибрати фільтр',
      litterFrom: 'Від',
      availableKittens: 'Доступні кошенята',
      noKittensMatchFilters:
        'Жодне кошеня не відповідає фільтрам. Спробуйте змінити вибір.',
      viewDetails: 'Детальніше',

      // Display fallbacks & age
      kittenFallbackName: 'Кошеня',
      noName: 'Без імені',
      breedNotSpecified: 'Порода не вказана',
      colorNotSpecified: 'Колір не вказано',
      ageNotSpecified: 'Вік не вказано',
      priceOnRequest: 'Ціна за запитом',
      kittenLoadError: 'Не вдалося завантажити дані про кошеня.',
      ageMonthsShort: 'міс.',
      ageDaysShort: 'дн.',
      carouselPrev: 'Попередні кошенята',
      carouselNext: 'Наступні кошенята',

      // Photo viewer
      viewerClose: 'Закрити галерею',
      viewerPrev: 'Попереднє фото',
      viewerNext: 'Наступне фото',
      viewerCounter: '{current} / {total}',
      viewerImageAlt: '{label} — фото {index}',
      viewerGoToImage: 'Перейти до фото {index}',

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
      menu: 'Відкрити меню',
      close: 'Закрити меню',

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

      // Home page — hero
      homeHeroTag: 'Розплідник WCF — з любов\'ю з 2014 року',
      homeHeroTitle1: 'Кошеня — це',
      homeHeroTitle2: 'не просто улюбленець.',
      homeHeroTitle3: 'Це родина.',
      homeHeroDescription: 'Ми вирощуємо кошенят, які стають повноправними членами родини — гріють холодні вечори, слухають ваші історії й перетворюють квартиру на справжній дім.',
      homeHeroCtaPrimary: 'Познайомитись із кошенятами →',
      homeHeroCtaSecondary: 'Про розплідник',
      homeHeroPillTitle: 'Усі кошенята соціалізовані',
      homeHeroPillText: 'Готові переїхати в люблячий дім',

      // Home page — philosophy
      homePhilosophyEyebrow: 'Наша філософія',
      homePhilosophyTitle1: 'Кіт —',
      homePhilosophyTitle2: 'невід\'ємна частина',
      homePhilosophyTitle3: 'сучасної квартири',
      homePhilosophyParagraph1: 'Сучасне життя — швидке, гучне, вимогливе. І саме тому нам потрібен кіт. Він не вимагає пояснень, коли ви повернулися пізно. Він просто приходить і лягає поряд.',
      homePhilosophyParagraph2: 'Кіт знає, коли вам сумно. Він відчуває тривогу, обирає саме ваші коліна й перетворює навіть порожню нову квартиру на справжній затишний дім.',
      homePhilosophyPoint1: 'Зустрічає біля дверей щодня',
      homePhilosophyPoint2: 'Створює атмосферу затишку без зусиль',
      homePhilosophyPoint3: 'Чує вас, коли ніхто інший не чує',

      // Home page — lifestyle / bento
      homeLifestyleEyebrow: 'Життя з котом',
      homeLifestyleTitle: 'Кожна мить — особлива',
      homeBentoSofaQuote: '«Диван ніколи не був таким затишним»',
      homeBentoMoonTitle: 'Нічний охоронець',
      homeBentoMoonText: 'Муркотіння кота — найкращий заспокійливий засіб. Науково доведено.',
      homeBentoCtaTitle: 'Готові стати родиною?',
      homeBentoCtaText: 'Ми допоможемо підібрати кошеня саме під ваш спосіб життя — активне чи спокійне, для великої родини чи затишної самотності.',
      homeBentoCtaButton: 'Дивитися кошенят →',

      // Home page — kittens block
      homeKittensEyebrow: 'Доступні кошенята',
      homeKittensTitle1: 'Познайомтеся з нашими',
      homeKittensTitle2: 'маленькими принцами й принцесами',
      homeKittensSeeAll: 'Дивитися всіх кошенят →',

      // Home page — why
      homeWhyEyebrow: 'Чому Arlen Fluffy Plush',
      homeWhyTitle: 'Кошенята з гарантією щастя',
      homeWhy1Title: 'Народжені вдома',
      homeWhy1Text: 'Кошенята ростуть у квартирі з першого дня — жодних кліток, лише тепло і турбота.',
      homeWhy2Title: 'Здоров\'я на 100%',
      homeWhy2Text: 'Ветеринарні довідки, щеплення, чипування та генетичні тести батьків.',
      homeWhy3Title: 'Підтримка назавжди',
      homeWhy3Text: 'Ми залишаємося на зв\'язку — консультуємо щодо харчування, здоров\'я і виховання.',
      homeWhy4Title: 'Документи WCF',
      homeWhy4Text: 'Метрики та родоводи міжнародного стандарту для кожного кошеняти.',

      // Home page — reviews
      homeReviewsEyebrow: 'Відгуки',
      homeReviewsTitle1: 'Родини, які вже',
      homeReviewsTitle2: 'знайшли свою любов',
      homeReview1Name: 'Анастасія М.',
      homeReview1City: 'Львів',
      homeReview1Text: 'Узяли Місяцю два роки тому. Тепер без неї неможливо уявити наш дім. Вона зустрічає нас з роботи, спить з нами і знає кожного на ім\'я.',
      homeReview2Name: 'Дмитро К.',
      homeReview2City: 'Харків',
      homeReview2Text: 'Спочатку дружина довго вмовляла. Тепер я сам не можу без нашого Графа. Це щось більше, ніж улюбленець — це маленька особистість.',
      homeReview3Name: 'Ольга Р.',
      homeReview3City: 'Вільнюс',
      homeReview3Text: 'Розплідник із душею. Кошенята здорові, соціалізовані, одразу адаптувалися. Допомогли обрати саме того, хто підходить нашій родині.',

      // Home page — contact
      homeContactEyebrow: 'Розпочніть подорож',
      homeContactTitle1: 'Ваш дім чекає свого',
      homeContactTitle2: 'пухнастого члена родини',
      homeContactDescription: 'Напишіть нам — ми розповімо про вільних кошенят, допоможемо з вибором і відповімо на будь-які запитання.',
      homeContactTelegramLabel: 'Telegram',
      homeContactWhatsappLabel: 'WhatsApp',
      homeContactEmailLabel: 'Email',
      homeContactCta: 'Написати в Telegram →',
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
    let value: string | Translations = translations;

    for (const k of keys) {
      if (typeof value === 'object' && value !== null && k in value) {
        value = (value as Translations)[k];
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
