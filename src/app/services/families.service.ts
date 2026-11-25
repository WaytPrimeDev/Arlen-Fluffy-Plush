import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ListParams, PaginatedResponse } from './filters.service';
import { buildListParams } from './http-params.util';
import { API_PATH } from './api';
import type { BreedRef, MaybeRef } from './taxonomy';
import type { KittenApiItem } from '../pages/kittens/kittens.service';
import type { ParentApiItem } from '../pages/parents/parents.service';

/**
 * A member of a litter, as either of the two things the API may send.
 *
 * The family endpoints now embed the kittens and the parents instead of
 * listing their ids, which is what removes the extra round trip the litter
 * grouping used to need. Both forms are declared because the embedded one is
 * newer than the pages that read it: an id still resolves against the listing
 * the page loads anyway, so the grouping works either way and starts saving
 * the lookup the moment the backend is deployed.
 */
export type FamilyMember<T> = T | string;

export interface FamilyParentsRef {
  /** Embedded parent, its id, or null when the litter names none. */
  mom: FamilyMember<ParentApiItem> | null;
  dad: FamilyMember<ParentApiItem> | null;
}

export interface FamilyApiItem {
  _id: string;
  name: string;
  parents: FamilyParentsRef;
  kittens: FamilyMember<KittenApiItem>[];
  /** Dictionary reference with the name already joined in; may be null. */
  breed?: MaybeRef<BreedRef>;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** The id of a member, whichever form it arrived in. */
export function familyMemberId(member: FamilyMember<{ _id: string }> | null | undefined): string | null {
  if (!member) {
    return null;
  }
  return typeof member === 'string' ? member : member._id;
}

/**
 * The embedded record, or null when only an id was sent. A caller that gets
 * null looks the id up in the listing it already has.
 */
export function familyMemberRecord<T extends { _id: string }>(
  member: FamilyMember<T> | null | undefined,
): T | null {
  return member && typeof member !== 'string' ? member : null;
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
