import { Injectable, Signal, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_PATH } from './api';
import { toRef, type BreedRef, type ColorRef, type MaybeRef } from './taxonomy';

export interface Pagination {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
  message?: string;
}

export interface ListParams {
  page?: number;
  perPage?: number;
  /**
   * The breed's slug — the same key its own page is addressed by, so one breed
   * is named one way everywhere. The API takes an `_id` here too, but a slug
   * in a URL says which breed is being filtered for, and a filter that
   * survives being copied out of the address bar is worth more than the few
   * characters an id would save. A name is rejected with a 400.
   */
  breed?: string;
  /**
   * The colour's `_id`. Colours have no slug — the dictionary carries nothing
   * but names — so this one stays an id.
   */
  color?: string;
}

/**
 * The backend answers `/filters/breeds` with `{ status, breeds: [...] }` and
 * `/filters/colors` with `{ status, colors: [...] }`, so the list lives under a
 * key named after the endpoint. The other shapes are kept as fallbacks in case
 * the response ever switches to `data` or to a bare array.
 *
 * The entries are objects — `{ _id, nameUa, nameEn, ... }`, plus `image` for a
 * breed — since the filters moved to ids. A deployment where the API still
 * answers with plain names is survived by `toRef`, which wraps a string into a
 * reference rather than letting it reach a template as `undefined`.
 */
type FiltersApiResponse<T extends BreedRef | ColorRef> =
  | MaybeRef<T>[]
  | { breeds?: MaybeRef<T>[]; colors?: MaybeRef<T>[]; data?: MaybeRef<T>[]; message?: string };

function extractList<T extends BreedRef | ColorRef>(
  response: FiltersApiResponse<T>,
  key: 'breeds' | 'colors',
): T[] {
  const raw = Array.isArray(response) ? response : (response?.[key] ?? response?.data ?? []);
  return raw.map((entry) => toRef<T>(entry)).filter((entry): entry is T => entry !== null);
}

@Injectable({
  providedIn: 'root',
})
export class FiltersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = API_PATH;

  private readonly breedsSignal = signal<BreedRef[]>([]);
  private readonly colorsSignal = signal<ColorRef[]>([]);
  private breedsLoaded = false;
  private colorsLoaded = false;

  readonly breeds: Signal<BreedRef[]> = this.breedsSignal.asReadonly();
  readonly colors: Signal<ColorRef[]> = this.colorsSignal.asReadonly();

  constructor() {
    this.loadBreeds();
    this.loadColors();
  }

  private loadBreeds(): void {
    if (this.breedsLoaded) {
      return;
    }
    this.breedsLoaded = true;
    this.http.get<FiltersApiResponse<BreedRef>>(`${this.apiUrl}/filters/breeds`).subscribe({
      next: (response) => this.breedsSignal.set(extractList(response, 'breeds')),
      error: () => {
        this.breedsLoaded = false;
      },
    });
  }

  private loadColors(): void {
    if (this.colorsLoaded) {
      return;
    }
    this.colorsLoaded = true;
    this.http.get<FiltersApiResponse<ColorRef>>(`${this.apiUrl}/filters/colors`).subscribe({
      next: (response) => this.colorsSignal.set(extractList(response, 'colors')),
      error: () => {
        this.colorsLoaded = false;
      },
    });
  }
}
