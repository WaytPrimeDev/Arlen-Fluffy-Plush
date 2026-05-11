import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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
  private readonly apiUrl = 'https://arlenback-production.up.railway.app/cats/parents';

  getParents(): Observable<ParentApiItem[]> {
    return this.http
      .get<ParentsApiResponse>(this.apiUrl)
      .pipe(map((response) => response.data ?? []));
  }

  getParentById(id: string): Observable<ParentApiItem> {
    return this.http
      .get<ParentApiResponse>(`https://arlenback-production.up.railway.app/cats/parent/${id}`)
      .pipe(map((response) => response.data));
  }
}
