import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { I18nService } from '../../services/i18n.service';

export interface KittenImage {
  full: string;
  mobile?: string;
  thumbnail?: string;
  isMain?: boolean;
}

export interface KittenPrice {
  breeding?: string;
  pet?: string;
}

export interface KittenParentRef {
  mom: string | null;
  dad: string | null;
}

export interface KittenApiItem {
  _id: string;
  nameUa?: string;
  nameEn?: string;
  breed?: string;
  color?: string;
  sex?: string;
  status?: string;
  birthDay?: string;
  images?: KittenImage[];
  price?: KittenPrice;
  parentId?: KittenParentRef;
}

export interface KittenDisplayItem extends KittenApiItem {
  name: string;
}

interface KittensApiResponse {
  data: KittenApiItem[];
  message: string;
}

interface KittenApiResponse {
  data: KittenApiItem;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class KittensService {
  private readonly apiUrl = 'http://localhost:3000';
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);

  getKittens(): Observable<KittenApiItem[]> {
    return this.http
      .get<KittensApiResponse>(`${this.apiUrl}/cats/kittens`)
      .pipe(map((response) => response.data ?? []));
  }

  getKittenById(id: string): Observable<KittenApiItem> {
    return this.http
      .get<KittenApiResponse>(`${this.apiUrl}/cats/kitten/${id}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Get the localized name for a kitten based on current language
   */
  getLocalizedName(kitten: KittenApiItem): string {
    const lang = this.i18n.getLanguage();
    return lang === 'uk' ? kitten.nameUa || kitten.nameEn || '' : kitten.nameEn || kitten.nameUa || '';
  }

  /**
   * Map kitten items with localized names
   */
  mapWithLocalizedNames(kittens: KittenApiItem[]): KittenDisplayItem[] {
    return kittens.map((kitten) => ({
      ...kitten,
      name: this.getLocalizedName(kitten),
    }));
  }
}
