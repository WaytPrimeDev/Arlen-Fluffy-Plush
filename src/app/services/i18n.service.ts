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

      // Common
      loading: 'Loading...',
      error: 'Error loading data',
      noData: 'No data available',
      details: 'Details',
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

      // Common
      loading: 'Завантаження...',
      error: 'Помилка завантаження даних',
      noData: 'Немає доступних даних',
      details: 'Деталі',
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
