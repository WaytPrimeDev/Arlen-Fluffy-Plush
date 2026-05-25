import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ListParams, PaginatedResponse } from '../../services/filters.service';
import { buildListParams } from '../../services/http-params.util';

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

@Injectable({
  providedIn: 'root',
})
export class FamiliesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://arlenback-production.up.railway.app/api';

  getFamilies(params: ListParams = {}): Observable<PaginatedResponse<FamilyApiItem>> {
    return this.http.get<PaginatedResponse<FamilyApiItem>>(`${this.apiUrl}/families`, {
      params: buildListParams(params),
    });
  }
}
