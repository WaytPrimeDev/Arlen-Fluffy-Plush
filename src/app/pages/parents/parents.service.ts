import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { I18nService } from '../../services/i18n.service';

export interface ParentImage {
  full: string;
  mobile?: string;
  thumbnail?: string;
  isMain?: boolean;
}

export interface ParentApiItem {
  _id: string;
  nameUa?: string;
  nameEn?: string;
  breed?: string;
  color?: string;
  sex?: string;
  familyId?: string[];
  Kittens?: string[];
  images?: ParentImage[];
}

export interface ParentDisplayItem extends ParentApiItem {
  name: string;
}

interface ParentsApiResponse {
  data: ParentApiItem[];
  message: string;
}

interface ParentApiResponse {
  data: ParentApiItem;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ParentsService {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);
  private readonly apiUrl = 'http://localhost:3000';

  getParents(): Observable<ParentApiItem[]> {
    return this.http
      .get<ParentsApiResponse>(`${this.apiUrl}/cats/parent`)
      .pipe(map((response) => response.data ?? []));
  }

  getParentById(id: string): Observable<ParentApiItem> {
    return this.http
      .get<ParentApiResponse>(`${this.apiUrl}/cats/parent/${id}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Get the localized name for a parent based on current language
   */
  getLocalizedName(parent: ParentApiItem): string {
    const lang = this.i18n.getLanguage();
    return lang === 'uk'
      ? parent.nameUa || parent.nameEn || ''
      : parent.nameEn || parent.nameUa || '';
  }

  /**
   * Map parent items with localized names
   */
  mapWithLocalizedNames(parents: ParentApiItem[]): ParentDisplayItem[] {
    return parents.map((parent) => ({
      ...parent,
      name: this.getLocalizedName(parent),
    }));
  }
}
