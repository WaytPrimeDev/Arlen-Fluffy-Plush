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
      /** Read by `plural`, which picks the entry the number calls for. */
      activeFiltersCount: {
        one: '{count} active filter',
        few: '{count} active filters',
        many: '{count} active filters',
      },
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
        "Contact us on Telegram for adoption details. We're happy to answer any questions.",
      contactOnTelegram: 'Contact us on Telegram',

      // Kittens page hero & tabs
      exploreOurKittens: 'Explore Our Kittens',
      exploreOurKittensSubtitle:
        'Find your perfect fluffy companion from our carefully bred kittens',
      availableKittensTab: 'Available Kittens',
      ourParentsTab: 'Our Parents',

      // Breed tiles & breed pages
      browseByBreed: 'Choose a breed',
      allBreedsTile: 'All kittens',
      allBreedsHint: 'Every breed at once',
      breedKittens: 'kittens',
      breedPageSubtitle: 'Kittens of this breed from our cattery, with photos, prices and parents',
      backToAllKittens: 'All kittens',
      breedNotFoundTitle: 'This breed does not exist',
      breedNotFoundText:
        'The link may be out of date. Pick a breed from the list, or look through every kitten.',
      kittenNotFoundTitle: 'This kitten is no longer listed',
      kittenNotFoundText:
        'It may have found a home, or the link may be out of date. Have a look at the kittens we have now.',
      parentNotFoundTitle: 'This cat is no longer listed',
      parentNotFoundText:
        'The link may be out of date. Have a look at the cats in our cattery now.',
      noKittensOfBreed: 'No kittens of this breed right now',
      ourQueens: 'Our Queens',
      ourStuds: 'Our Studs',
      noParentsMatchFilter: 'No parents match your filter.',
      noParentsYet: 'No parents published yet',
      viewMode: 'View mode',

      // Kitten carousel
      kittenCarousel: 'carousel',
      scrollToPreviousKittens: 'Previous kittens',
      scrollToNextKittens: 'Next kittens',

      // Card photo gallery
      photoGallery: 'photo gallery',
      previousPhoto: 'Previous photo',
      nextPhoto: 'Next photo',
      photoNumber: 'Photo',
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
      homeWhy4Title: 'Delivery worldwide',
      homeWhy4Text:
        'We bring kittens to any country — full documents, safe transport and warm hands all the way to your door.',
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
      /** Read by `plural`, which picks the entry the number calls for. */
      kittensCount: {
        one: '{count} kitten',
        few: '{count} kittens',
        many: '{count} kittens',
      },
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
      footerAbout: 'Breeding exceptional fluffy kittens with love and dedication.',
      quickLinks: 'Quick Links',
      ourStory: 'Our Story',
      contactUs: 'Contact Us',
      connectWithUs: 'Connect With Us',
      allRightsReserved: 'All rights reserved.',
      madeWith: 'Made with',
      forFluffyFriends: 'for fluffy friends',
      // Cookie notice
      cookieBannerTitle: 'We use cookies',
      cookieBannerText:
        'We use cookies so the site remembers your language, and — only if you agree — so we can see which pages are read most. Refusing keeps the statistics off entirely. What is stored, and for how long, is set out here:',
      cookieBannerAccept: 'Accept',
      cookieBannerDecline: 'Necessary only',
      cookiePolicy: 'Cookie Policy',

      // Cookie policy page
      cookiesHeroTitle: 'Cookie Policy',
      cookiesHeroSubtitle:
        'What the Arlen Fluffy Plush website stores on your device, why it is stored, and how you can remove it at any time.',
      cookiesUpdated: 'Last updated: 26 November 2026',
      cookiesWhatTitle: 'What cookies are',
      cookiesWhatP1:
        'A cookie is a small text file that a website asks your browser to keep on your device. On the next visit the browser sends it back, which is how a site can recognise the settings you have already chosen without asking again.',
      cookiesWhatP2:
        'Cookies are not programs: they cannot read your files, see your other tabs or run anything on your device. The ones this site uses hold a language code, a record that you have read this notice, and anonymous visit statistics.',
      cookiesListTitle: 'The cookies this site uses',
      cookiesListP1:
        'This is the full list. You can check it yourself in your browser’s storage inspector while this page is open.',
      cookiesTableCaption:
        'Cookies set by the Arlen Fluffy Plush website, with their group, purpose and lifetime.',
      cookiesTableName: 'Name',
      cookiesTableGroup: 'Group',
      cookiesTablePurpose: 'Purpose',
      cookiesTableLifetime: 'Lifetime',
      cookiesGroupNecessary: 'Necessary',
      cookiesGroupAnalytics: 'Analytics',
      cookieLanguagePurpose:
        'Remembers the language you chose, so a link without a language prefix opens in it.',
      cookieConsentPurpose:
        'Remembers your answer to this notice, so it is not shown on every page.',
      cookieGaPurpose:
        'Google Analytics: tells one browser from another, so visits are not counted twice.',
      cookieGaSessionPurpose: 'Google Analytics: keeps the state of the current visit.',
      cookieGidPurpose: 'Google Analytics: groups the page views of one visit over a day.',
      cookieLife1Year: '1 year',
      cookieLife2Years: '2 years',
      cookieLife24Hours: '24 hours',
      cookiesNecessaryDesc:
        'These two are set by the site itself and carry no identifier of you — only a language code, and the word “accepted” or “declined”. Without them the site would forget your language on every page and would show this notice again each time.',
      cookiesAnalyticsDesc:
        'Analytics cookies are set by Google Analytics 4, which the site loads through Google Tag Manager — and only once you have accepted. Until then, and for good if you refuse, the tag manager is never requested at all: no script is fetched from Google, no analytics cookie is created and no event is sent. Once on, they report aggregated statistics: how many people opened a page, which kittens are looked at, how far a page is read. We use them to see which parts of the cattery’s site are useful and which are not. We do not use them for advertising, and we do not sell this data.',
      cookiesStorageNote:
        'Besides cookies, the site keeps two values in your browser’s local storage: the language code and your answer to this notice. They stay on your device, are never sent to a server, and clearing the site’s data removes them — which is also what brings this notice back.',
      // The consent controls on the policy page. Withdrawing has to be as
      // easy as giving consent was, so the page carries the same two answers
      // the notice does rather than only instructions for the browser.
      cookiesConsentTitle: 'Your choice, and how to change it',
      cookiesConsentP1:
        'Your answer to the cookie notice is recorded in this browser, and you can change it here at any time — withdrawing is one click, exactly as accepting was. Refusing also deletes any Google Analytics cookies an earlier visit left behind.',
      cookiesConsentStatusLabel: 'Current choice',
      cookiesConsentStateAccepted: 'Analytics cookies accepted.',
      cookiesConsentStateDeclined: 'Necessary cookies only. Analytics is off.',
      cookiesConsentStateUnanswered: 'Not answered yet — analytics is off until you accept.',
      cookiesConsentAccept: 'Accept analytics cookies',
      cookiesConsentWithdraw: 'Withdraw consent',
      cookiesConsentDecline: 'Necessary only',
      cookiesThirdPartyTitle: 'Third-party services',
      cookiesThirdPartyP1:
        'Some of the cookies above are set not by us but by the services the site loads:',
      cookiesThirdPartyGoogle:
        'Google Analytics 4 and Google Tag Manager (Google Ireland Limited) — visit statistics. Google describes its own cookies at',
      cookiesThirdPartyFonts:
        'Google Fonts — the typefaces the site is set in. It serves font files and sets no cookies of its own.',
      cookiesThirdPartyP2:
        'Links from this site to Instagram, TikTok or Telegram open those services in a new tab. What they store on your device is governed by their own policies, not by this one.',
      cookiesLegalTitle: 'Legal basis',
      cookiesLegalP1:
        'The necessary cookies are set because the site cannot give you what you asked for without them — a page in the language you chose, and a notice that does not keep reappearing.',
      cookiesLegalP2:
        'Analytics cookies rest on your consent, and nothing analytical happens without it. The notice at the bottom of the page offers both answers: “Accept” turns the statistics on, “Necessary only” leaves them off and clears any analytics cookies an earlier visit left behind. You can withdraw an acceptance at any time, on this page, with the button above — it takes the same single click that giving it did, and no browser settings are involved. If you are in the EU or the EEA, the GDPR applies to you; in Ukraine, the Law of Ukraine “On the Protection of Personal Data” applies.',
      cookiesManageTitle: 'How to manage or remove cookies',
      cookiesManageP1:
        'You do not need any of this to withdraw your consent — the button above does that. But every browser can also show, delete and block cookies, for one site or for all of them, and clearing this site’s data resets everything at once: the notice comes back on your next visit, and the site forgets your language choice as well:',
      cookiesManageChrome: 'Chrome: Settings → Privacy and security → Third-party cookies.',
      cookiesManageSafari: 'Safari: Settings → Privacy → Manage Website Data.',
      cookiesManageFirefox: 'Firefox: Settings → Privacy & Security → Cookies and Site Data.',
      cookiesManageEdge: 'Edge: Settings → Cookies and site permissions.',
      cookiesManageP2:
        'Blocking cookies entirely does not stop you using the site: the catalogue, the photos and the contact details all work without them. Only your language choice, and your answer to this notice, will not be remembered between visits.',
      cookiesChangesTitle: 'Changes to this policy',
      cookiesChangesP1:
        'If the set of cookies the site uses changes, this page changes with it and the date at the top is updated. Please look at it again from time to time.',
      cookiesContactTitle: 'Questions',
      cookiesContactP1:
        'Write to us if anything here is unclear, or if you want to know what has been stored about your visit:',

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
      aboutIntroImageAlt:
        'A bright cattery room with a cat tree, wall shelves and beds, where Ragdoll cats play on a rug',
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
      valueDeliveryTitle: 'A world without borders',
      valueDeliveryDesc:
        'We send our kittens to any country in the world — with full documents, safe transport and care at every kilometre.',
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
      readiness2Desc: 'Kittens move to their new families fully vaccinated and microchipped.',
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

      // Kitten video
      video: 'Video',
      videoPlay: 'Play the video about {label}',
      videoTitle: 'Video about {label}',
      viewerGoToVideo: 'Go to the video',
      videoWatchOnYoutube: 'Watch on YouTube',

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
      petPrice: 'У домашні улюбленці',
      breedingPrice: 'У розведення',
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
      /** Read by `plural`, which picks the entry the number calls for. */
      activeFiltersCount: {
        one: '{count} активний фільтр',
        few: '{count} активні фільтри',
        many: '{count} активних фільтрів',
      },
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
        'Напишіть нам у Telegram, щоб дізнатися деталі. Ми залюбки відповімо на всі запитання.',
      contactOnTelegram: 'Написати в Telegram',

      // Kittens page hero & tabs
      exploreOurKittens: 'Наші кошенята',
      exploreOurKittensSubtitle:
        'Знайдіть ідеального пухнастого друга з-поміж наших дбайливо вирощених кошенят',
      availableKittensTab: 'Доступні кошенята',
      ourParentsTab: 'Наші батьки',

      // Breed tiles & breed pages
      browseByBreed: 'Оберіть породу',
      allBreedsTile: 'Усі кошенята',
      allBreedsHint: 'Усі породи разом',
      breedKittens: 'кошенят',
      breedPageSubtitle: 'Кошенята цієї породи з нашого розплідника — фото, ціни та батьки кожного',
      backToAllKittens: 'Усі кошенята',
      breedNotFoundTitle: 'Такої породи не існує',
      breedNotFoundText:
        'Можливо, посилання застаріло. Оберіть породу зі списку або подивіться всіх кошенят.',
      kittenNotFoundTitle: 'Це кошеня більше не в каталозі',
      kittenNotFoundText:
        'Можливо, воно вже знайшло дім або посилання застаріло. Подивіться кошенят, які є зараз.',
      parentNotFoundTitle: 'Цього кота більше не в каталозі',
      parentNotFoundText:
        'Можливо, посилання застаріло. Подивіться котів нашого розплідника зараз.',
      noKittensOfBreed: 'Зараз немає кошенят цієї породи',
      ourQueens: 'Наші мами',
      ourStuds: 'Наші тата',
      noParentsMatchFilter: 'Немає батьків, що відповідають фільтру.',
      noParentsYet: 'Поки що без батьків',
      viewMode: 'Режим перегляду',

      // Kitten carousel
      kittenCarousel: 'карусель',
      scrollToPreviousKittens: 'Попередні кошенята',
      scrollToNextKittens: 'Наступні кошенята',

      // Card photo gallery
      photoGallery: 'фотогалерея',
      previousPhoto: 'Попереднє фото',
      nextPhoto: 'Наступне фото',
      photoNumber: 'Фото',
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
      homeHeroImageAlt:
        'Пухнастий кіт рагдол відпочиває на сонячному підвіконні у затишній вітальні',
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
      homeWhy4Title: 'Доставка у будь-яку країну',
      homeWhy4Text:
        'Доставляємо в усі міста України та в будь-яку країну світу — документи, надійний супровід і турбота до ваших дверей.',
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
      /** Read by `plural`, which picks the entry the number calls for. */
      kittensCount: {
        one: '{count} кошеня',
        few: '{count} кошенята',
        many: '{count} кошенят',
      },
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
      footerAbout: 'Розводимо виняткових пухнастих кошенят із любов’ю та відданістю.',
      quickLinks: 'Швидкі посилання',
      ourStory: 'Наша історія',
      contactUs: 'Зв’язатися з нами',
      connectWithUs: 'Зв’язок з нами',
      allRightsReserved: 'Усі права захищені.',
      madeWith: 'Зроблено з',
      forFluffyFriends: 'для пухнастих друзів',
      // Cookie notice
      cookieBannerTitle: 'Ми використовуємо файли cookie',
      cookieBannerText:
        'Ми використовуємо cookie, щоб сайт пам’ятав вашу мову, і — лише за вашої згоди — щоб бачити, які сторінки читають найчастіше. Якщо відмовитесь, статистика не увімкнеться взагалі. Що саме зберігається і на який час — описано тут:',
      cookieBannerAccept: 'Прийняти',
      cookieBannerDecline: 'Лише необхідні',
      cookiePolicy: 'Політика cookie',

      // Cookie policy page
      cookiesHeroTitle: 'Політика використання файлів cookie',
      cookiesHeroSubtitle:
        'Що сайт Arlen Fluffy Plush зберігає на вашому пристрої, для чого саме і як це можна видалити будь-коли.',
      cookiesUpdated: 'Останнє оновлення: 26 листопада 2026 року',
      cookiesWhatTitle: 'Що таке cookie',
      cookiesWhatP1:
        'Cookie — це невеликий текстовий файл, який сайт просить ваш браузер зберегти на пристрої. Під час наступного візиту браузер надсилає його назад, і саме так сайт впізнає налаштування, які ви вже обрали, і не питає про них удруге.',
      cookiesWhatP2:
        'Cookie не є програмами: вони не читають ваших файлів, не бачать інших вкладок і нічого не запускають на пристрої. Ті, що використовує цей сайт, зберігають код мови, відмітку про прочитане повідомлення та анонімну статистику відвідувань.',
      cookiesListTitle: 'Які cookie використовує цей сайт',
      cookiesListP1:
        'Це повний перелік. Ви можете перевірити його самостійно в інспекторі сховища свого браузера, поки ця сторінка відкрита.',
      cookiesTableCaption:
        'Файли cookie сайту Arlen Fluffy Plush: група, призначення та термін зберігання.',
      cookiesTableName: 'Назва',
      cookiesTableGroup: 'Група',
      cookiesTablePurpose: 'Призначення',
      cookiesTableLifetime: 'Термін',
      cookiesGroupNecessary: 'Необхідні',
      cookiesGroupAnalytics: 'Аналітичні',
      cookieLanguagePurpose:
        'Запам’ятовує обрану вами мову, щоб посилання без мовного префікса відкривалося саме нею.',
      cookieConsentPurpose:
        'Запам’ятовує вашу відповідь на це повідомлення, щоб воно не з’являлося на кожній сторінці.',
      cookieGaPurpose:
        'Google Analytics: відрізняє один браузер від іншого, щоб візити не рахувалися двічі.',
      cookieGaSessionPurpose: 'Google Analytics: зберігає стан поточного візиту.',
      cookieGidPurpose:
        'Google Analytics: об’єднує перегляди сторінок одного візиту протягом доби.',
      cookieLife1Year: '1 рік',
      cookieLife2Years: '2 роки',
      cookieLife24Hours: '24 години',
      cookiesNecessaryDesc:
        'Ці два файли встановлює сам сайт, і вони не містять жодного ідентифікатора вас — лише код мови та слово «прийнято» або «відмовлено». Без них сайт забував би вашу мову на кожній сторінці й показував би це повідомлення щоразу.',
      cookiesAnalyticsDesc:
        'Аналітичні cookie встановлює Google Analytics 4, який сайт завантажує через Google Tag Manager — і лише після того, як ви прийняли повідомлення. До того, а в разі відмови — й зовсім, тег-менеджер не завантажується взагалі: жоден скрипт із Google не запитується, жоден аналітичний cookie не створюється і жодна подія не надсилається. Увімкнені, вони дають узагальнену статистику: скільки людей відкрили сторінку, яких кошенят дивляться, наскільки далеко читають сторінку. Ми використовуємо це, щоб бачити, які частини сайту розплідника корисні, а які — ні. Для рекламного таргетингу ми їх не використовуємо і цих даних не продаємо.',
      cookiesStorageNote:
        'Крім cookie, сайт зберігає у локальному сховищі браузера два значення: код мови та вашу відповідь на це повідомлення. Вони залишаються лише на вашому пристрої, не надсилаються на сервер, і очищення даних сайту видаляє їх — саме це й повертає це повідомлення.',
      // Елементи керування згодою на самій сторінці політики: відкликати згоду
      // має бути так само просто, як її надати, тому тут ті самі дві відповіді,
      // що й у повідомленні, а не лише інструкції для браузера.
      cookiesConsentTitle: 'Ваш вибір і як його змінити',
      cookiesConsentP1:
        'Ваша відповідь на повідомлення про cookie зберігається в цьому браузері, і ви можете змінити її тут будь-коли — відкликати згоду так само просто, як було її надати. Відмова також видаляє аналітичні cookie Google, якщо вони залишилися від попереднього візиту.',
      cookiesConsentStatusLabel: 'Поточний вибір',
      cookiesConsentStateAccepted: 'Аналітичні cookie прийнято.',
      cookiesConsentStateDeclined: 'Лише необхідні cookie. Аналітика вимкнена.',
      cookiesConsentStateUnanswered:
        'Відповіді ще немає — аналітика вимкнена, доки ви не приймете її.',
      cookiesConsentAccept: 'Прийняти аналітичні cookie',
      cookiesConsentWithdraw: 'Відкликати згоду',
      cookiesConsentDecline: 'Лише необхідні',
      cookiesThirdPartyTitle: 'Сторонні сервіси',
      cookiesThirdPartyP1:
        'Частину cookie з таблиці вище встановлюємо не ми, а сервіси, які завантажує сайт:',
      cookiesThirdPartyGoogle:
        'Google Analytics 4 і Google Tag Manager (Google Ireland Limited) — статистика відвідувань. Власні cookie Google описані тут:',
      cookiesThirdPartyFonts:
        'Google Fonts — шрифти, якими набрано сайт. Сервіс віддає файли шрифтів і власних cookie не встановлює.',
      cookiesThirdPartyP2:
        'Посилання з цього сайту на Instagram, TikTok чи Telegram відкривають ці сервіси в новій вкладці. Те, що вони зберігають на вашому пристрої, регулюється їхніми власними політиками, а не цією.',
      cookiesLegalTitle: 'Правова підстава',
      cookiesLegalP1:
        'Необхідні cookie встановлюються тому, що без них сайт не може дати саме те, про що ви попросили — сторінку обраною мовою та повідомлення, яке не з’являється знову і знову.',
      cookiesLegalP2:
        'Аналітичні cookie ґрунтуються на вашій згоді, і без неї жодна аналітика не працює. Повідомлення внизу сторінки пропонує дві відповіді: «Прийняти» вмикає статистику, а «Лише необхідні» залишає її вимкненою й очищає аналітичні cookie, якщо вони залишилися від попереднього візиту. Надану згоду можна відкликати будь-коли — кнопкою вище на цій самій сторінці, одним кліком, так само як її було надано, без жодних налаштувань браузера. Якщо ви перебуваєте в ЄС або ЄЕЗ, до вас застосовується GDPR; в Україні — Закон України «Про захист персональних даних».',
      cookiesManageTitle: 'Як керувати cookie або видалити їх',
      cookiesManageP1:
        'Щоб відкликати згоду, нічого з цього не потрібно — для цього є кнопка вище. Але кожен браузер також уміє показувати, видаляти та блокувати cookie — окремо для сайту або для всіх сайтів, а очищення даних цього сайту скидає все разом: повідомлення з’явиться знову при наступному візиті, а сайт забуде й вибір мови:',
      cookiesManageChrome:
        'Chrome: Налаштування → Конфіденційність і безпека → Сторонні файли cookie.',
      cookiesManageSafari:
        'Safari: Налаштування → Конфіденційність → Керувати даними сайтів.',
      cookiesManageFirefox:
        'Firefox: Налаштування → Приватність і захист → Куки та дані сайтів.',
      cookiesManageEdge: 'Edge: Налаштування → Файли cookie та дозволи сайтів.',
      cookiesManageP2:
        'Повне блокування cookie не заважає користуватися сайтом: каталог, фотографії та контакти працюють і без них. Не збережеться лише вибір мови та ваша відповідь на це повідомлення між візитами.',
      cookiesChangesTitle: 'Зміни до цієї політики',
      cookiesChangesP1:
        'Якщо набір cookie на сайті зміниться, ця сторінка зміниться разом із ним, а дату вгорі буде оновлено. Радимо час від часу зазирати сюди знову.',
      cookiesContactTitle: 'Питання',
      cookiesContactP1:
        'Напишіть нам, якщо щось тут незрозуміло або якщо ви хочете дізнатися, що саме збережено про ваш візит:',

      // About page
      aboutHeroTitle: 'Наша історія',
      aboutHeroSubtitle: 'Подорож пристрасті, відданості та любові до виняткових пухнастих кошенят',
      aboutIntroTitle: 'Досконалість у розведенні з 2010 року',
      aboutIntroP1:
        'Наша історія розпочалася ще у 2010 році, коли в нашому домі з’явилася перша шотландська прямовуха кішка. Саме з неї зародилася наша велика любов, захоплення та професійний шлях у світі котів.',
      aboutIntroP2:
        'З вересня 2016 року ми офіційно зареєстровані як розплідник у Всесвітній федерації котів (WCF) під назвою Arlen Fluffy Plush. У 2021 році ми відкрили для себе дивовижну породу регдол, і з того часу робота з цими королівськими котами стала основним напрямком нашого розплідника. Сьогодні ми працюємо з кількома породами, але регдоли залишаються головними.',
      aboutIntroP3:
        'Для нашої родини це не просто улюблена справа — це частина нашого життя. Народження кожного нового помету кошенят для нас — це справжнє свято, на яке ми чекаємо з великим трепетом і нетерпінням.',
      aboutIntroImageAlt:
        'Світла кімната розплідника з ігровим комплексом, полицями та лежанками, де на килимі граються коти рагдол',
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
      valueDeliveryTitle: 'Світ без кордонів',
      valueDeliveryDesc:
        'Ми доставляємо кошенят в усі міста України та в будь-яку країну світу — з усіма документами, безпечним супроводом і турботою на кожному кілометрі шляху.',
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

      // Kitten video
      video: 'Відео',
      videoPlay: 'Подивитися відео про {label}',
      videoTitle: 'Відео про {label}',
      viewerGoToVideo: 'Перейти до відео',
      videoWatchOnYoutube: 'Дивитися на YouTube',

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

  /**
   * A counted phrase in the form the number calls for, with `{count}` already
   * filled in: `plural('kittensCount', 1)` reads "1 кошеня" and
   * `plural('kittensCount', 5)` reads "5 кошенят".
   *
   * The count cannot simply be pasted in front of a noun. Ukrainian puts that
   * noun in three different forms depending on the number — одне кошеня, два
   * кошенята, п'ять кошенят — and English in two, so a template that writes
   * `{{ count }} {{ t('kittens') }}` is wrong for most numbers in both
   * languages. The whole phrase therefore belongs to the translation, under a
   * key that holds one entry per form.
   */
  plural(
    key: string,
    count: number,
    params?: Readonly<Record<string, string | number>>,
  ): string {
    return this.translate(`${key}.${pluralCategory(count, this.language())}`, {
      count,
      ...params,
    });
  }
}

/** The grammatical forms a counted phrase is written in. */
type PluralCategory = 'one' | 'few' | 'many';

/**
 * Which form a number calls for.
 *
 * Ukrainian follows the usual East Slavic rule — `one` for numbers ending in
 * 1 but not 11, `few` for those ending in 2 to 4 but not 12 to 14, `many` for
 * the rest. English has only a singular and a plural, so it answers `one` or
 * `many` and never `few`; the `few` entry is still written for it, which keeps
 * every phrase complete in both languages.
 */
function pluralCategory(count: number, language: Language): PluralCategory {
  const value = Math.abs(Math.trunc(count));

  if (language === 'en') {
    return value === 1 ? 'one' : 'many';
  }

  const lastDigit = value % 10;
  const lastTwo = value % 100;

  if (lastDigit === 1 && lastTwo !== 11) {
    return 'one';
  }

  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) {
    return 'few';
  }

  return 'many';
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
