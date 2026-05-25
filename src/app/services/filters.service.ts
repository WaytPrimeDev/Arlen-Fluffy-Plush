import { Injectable, Signal, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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

type FiltersApiResponse = string[] | { data?: string[]; message?: string };

function extractList(response: FiltersApiResponse): string[] {
  if (Array.isArray(response)) {
    return response;
  }
  return response?.data ?? [];
}

@Injectable({
  providedIn: 'root',
})
export class FiltersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://arlenback-production.up.railway.app/api';

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
    this.http
      .get<FiltersApiResponse>(`${this.apiUrl}/filters/breeds`)
      .subscribe({
        next: (response) => this.breedsSignal.set(extractList(response)),
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
    this.http
      .get<FiltersApiResponse>(`${this.apiUrl}/filters/colors`)
      .subscribe({
        next: (response) => this.colorsSignal.set(extractList(response)),
        error: () => {
          this.colorsLoaded = false;
        },
      });
  }
}
