import { Injectable, Signal, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_PATH } from './api';

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
  breed?: string;
  color?: string;
}

/**
 * The backend answers `/filters/breeds` with `{ status, breeds: [...] }` and
 * `/filters/colors` with `{ status, colors: [...] }`, so the list lives under a
 * key named after the endpoint. The other shapes are kept as fallbacks in case
 * the response ever switches to `data` or to a bare array.
 */
type FiltersApiResponse =
  | string[]
  | { breeds?: string[]; colors?: string[]; data?: string[]; message?: string };

function extractList(response: FiltersApiResponse, key: 'breeds' | 'colors'): string[] {
  if (Array.isArray(response)) {
    return response;
  }
  return response?.[key] ?? response?.data ?? [];
}

@Injectable({
  providedIn: 'root',
})
export class FiltersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = API_PATH;

  private readonly breedsSignal = signal<string[]>([]);
  private readonly colorsSignal = signal<string[]>([]);
  private breedsLoaded = false;
  private colorsLoaded = false;

  readonly breeds: Signal<string[]> = this.breedsSignal.asReadonly();
  readonly colors: Signal<string[]> = this.colorsSignal.asReadonly();

  constructor() {
    this.loadBreeds();
    this.loadColors();
  }

  private loadBreeds(): void {
    if (this.breedsLoaded) {
      return;
    }
    this.breedsLoaded = true;
    this.http.get<FiltersApiResponse>(`${this.apiUrl}/filters/breeds`).subscribe({
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
    this.http.get<FiltersApiResponse>(`${this.apiUrl}/filters/colors`).subscribe({
      next: (response) => this.colorsSignal.set(extractList(response, 'colors')),
      error: () => {
        this.colorsLoaded = false;
      },
    });
  }
}
