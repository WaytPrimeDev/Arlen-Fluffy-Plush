import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://arlenback-production.up.railway.app/cats/kittens';

  getKittens(): Observable<KittenApiItem[]> {
    return this.http
      .get<KittensApiResponse>(this.apiUrl)
      .pipe(map((response) => response.data ?? []));
  }

  getKittenById(id: string): Observable<KittenApiItem> {
    return this.http
      .get<KittenApiResponse>(`https://arlenback-production.up.railway.app/cats/kitten/${id}`)
      .pipe(map((response) => response.data));
  }
}
