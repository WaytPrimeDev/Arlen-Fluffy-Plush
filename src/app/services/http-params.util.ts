import { HttpParams } from '@angular/common/http';
import type { ListParams } from './filters.service';

export function buildListParams(params: ListParams = {}): HttpParams {
  let httpParams = new HttpParams();
  if (params.page !== undefined) {
    httpParams = httpParams.set('page', String(params.page));
  }
  if (params.perPage !== undefined) {
    httpParams = httpParams.set('perPage', String(params.perPage));
  }
  if (params.breed) {
    httpParams = httpParams.set('breed', params.breed);
  }
  if (params.color) {
    httpParams = httpParams.set('color', params.color);
  }
  return httpParams;
}
