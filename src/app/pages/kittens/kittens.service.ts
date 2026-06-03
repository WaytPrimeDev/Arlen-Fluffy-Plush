import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { I18nService } from '../../services/i18n.service';
import type { ListParams, PaginatedResponse } from '../../services/filters.service';
import { buildListParams } from '../../services/http-params.util';
import { resolveDisplayName } from '../../services/translit.util';

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
  createdAt?: string;
  updatedAt?: string;
}

export interface KittenDisplayItem extends KittenApiItem {
  name: string;
}

interface KittenApiResponse {
  data: KittenApiItem;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class KittensService {
  private readonly apiUrl = 'https://arlenback-production.up.railway.app/api';
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);

  getKittens(params: ListParams = {}): Observable<PaginatedResponse<KittenApiItem>> {
    return this.http.get<PaginatedResponse<KittenApiItem>>(`${this.apiUrl}/cats/kittens`, {
      params: buildListParams(params),
    });
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
    return resolveDisplayName(kitten.nameUa, kitten.nameEn, this.i18n.getLanguage(), '');
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
