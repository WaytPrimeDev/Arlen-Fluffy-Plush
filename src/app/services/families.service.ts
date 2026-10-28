import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ListParams, PaginatedResponse } from './filters.service';
import { buildListParams } from './http-params.util';
import { API_PATH } from './api';

export interface FamilyParentsRef {
  mom: string | null;
  dad: string | null;
}

export interface FamilyApiItem {
  _id: string;
  name: string;
  parents: FamilyParentsRef;
  kittens: string[];
  breed: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lives here rather than under a page, because the families page is gone and
 * the only reader left is the litter grouping on the kittens page.
 */
@Injectable({
  providedIn: 'root',
})
export class FamiliesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = API_PATH;

  getFamilies(params: ListParams = {}): Observable<PaginatedResponse<FamilyApiItem>> {
    return this.http.get<PaginatedResponse<FamilyApiItem>>(`${this.apiUrl}/families`, {
      params: buildListParams(params),
    });
  }
}
