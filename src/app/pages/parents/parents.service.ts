import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { I18nService } from '../../services/i18n.service';
import type { ListParams, PaginatedResponse } from '../../services/filters.service';
import { buildListParams } from '../../services/http-params.util';
import { resolveDisplayName } from '../../services/translit.util';

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
  private readonly apiUrl = 'https://arlenback-production.up.railway.app/api';

  getParents(params: ListParams = {}): Observable<PaginatedResponse<ParentApiItem>> {
    return this.http.get<PaginatedResponse<ParentApiItem>>(`${this.apiUrl}/cats/parents`, {
      params: buildListParams(params),
    });
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
    return resolveDisplayName(parent.nameUa, parent.nameEn, this.i18n.getLanguage(), '');
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
