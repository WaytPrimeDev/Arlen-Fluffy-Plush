import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_PATH } from './api';
import { buildListParams } from './http-params.util';
import { toRef, type BreedRef } from './taxonomy';
import type { ListParams, Pagination, PaginatedResponse } from './filters.service';
import type { KittenApiItem } from '../pages/kittens/kittens.service';
import type { ParentApiItem } from '../pages/parents/parents.service';

interface BreedsApiResponse {
  status?: number;
  breeds?: BreedRef[];
  data?: BreedRef[];
  message?: string;
}

/** `/breeds/:slug` answers with the breed and its first page of kittens. */
export interface BreedPageResponse {
  breed: BreedRef;
  kittens: KittenApiItem[];
  pagination: Pagination;
  message?: string;
}

/**
 * The public breed endpoints. They are a second way into the same catalogue —
 * the "only kittens that belong to a litter" rule is the one the general
 * listing uses — so a breed page needs no filtering of its own.
 */
@Injectable({ providedIn: 'root' })
export class BreedsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = API_PATH;

  /** Every breed, with the cover photo the tiles and the sitemap need. */
  getBreeds(): Observable<BreedRef[]> {
    return this.http.get<BreedsApiResponse | BreedRef[]>(`${this.apiUrl}/breeds`).pipe(
      map((response) => {
        const raw = Array.isArray(response) ? response : (response.breeds ?? response.data ?? []);
        return raw.map((entry) => toRef<BreedRef>(entry)).filter((b): b is BreedRef => b !== null);
      }),
    );
  }

  /** The breed itself plus its first screen of kittens. 404 for a bad slug. */
  getBreed(slug: string): Observable<BreedPageResponse> {
    return this.http.get<BreedPageResponse>(`${this.apiUrl}/breeds/${encodeURIComponent(slug)}`);
  }

  getBreedKittens(
    slug: string,
    params: Omit<ListParams, 'breed'> = {},
  ): Observable<PaginatedResponse<KittenApiItem>> {
    return this.http.get<PaginatedResponse<KittenApiItem>>(
      `${this.apiUrl}/breeds/${encodeURIComponent(slug)}/kittens`,
      { params: buildListParams(params) },
    );
  }

  getBreedParents(
    slug: string,
    params: Pick<ListParams, 'page' | 'perPage'> = {},
  ): Observable<PaginatedResponse<ParentApiItem>> {
    return this.http.get<PaginatedResponse<ParentApiItem>>(
      `${this.apiUrl}/breeds/${encodeURIComponent(slug)}/parents`,
      { params: buildListParams(params) },
    );
  }
}
