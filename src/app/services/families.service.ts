import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, concatMap, first, forkJoin, from, map, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
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

/** What one request asks for: a cattery's litters fit in a single page. */
const WHOLE_LIST_PER_PAGE = 1000;

/**
 * How far the crawl below looks for a readable page before giving up on
 * learning how many litters there are. The first page that answers carries
 * `pagination.totalItems`, so this only has to outlast a run of unreadable
 * records at the head of the listing.
 */
const PROBE_PAGES = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Ceiling on the one-record-per-request crawl. It is the slow path for a
 * backend that cannot serve the listing whole, not a way to page through a
 * catalogue of any size, so it stops rather than firing hundreds of requests.
 */
const CRAWL_LIMIT = 120;

/** A request for one record, used by both the probe and the crawl. */
type SingleRecordParams = Omit<ListParams, 'page' | 'perPage'>;

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

  /**
   * Every litter, as complete as the backend can make it.
   *
   * `/families` joins each litter's parents in, so a single parent record
   * whose breed or colour was saved as text instead of as a dictionary
   * reference fails the request — and with it every litter on the page, not
   * just the one that cannot be read. That is what emptied the whole grouping
   * and left the page apologising for a catalogue it had actually loaded.
   *
   * So the listing is asked for whole first, which is the normal path and one
   * request; only when that fails is it read one record per request, and an
   * unreadable litter then costs its own card instead of all of them.
   */
  getAllFamilies(params: SingleRecordParams = {}): Observable<FamilyApiItem[]> {
    return this.getFamilies({ ...params, page: 1, perPage: WHOLE_LIST_PER_PAGE }).pipe(
      map((response) => response.data ?? []),
      catchError(() => this.crawlFamilies(params)),
    );
  }

  /** The listing read one record at a time, skipping the records that fail. */
  private crawlFamilies(params: SingleRecordParams): Observable<FamilyApiItem[]> {
    return this.countFamilies(params).pipe(
      switchMap((total) => {
        const pages = Math.min(total, CRAWL_LIMIT);
        if (pages <= 0) {
          return of<FamilyApiItem[]>([]);
        }

        return forkJoin(
          Array.from({ length: pages }, (_, index) =>
            this.getFamilies({ ...params, page: index + 1, perPage: 1 }).pipe(
              map((response) => response.data ?? []),
              catchError(() => of<FamilyApiItem[]>([])),
            ),
          ),
        ).pipe(map((records) => records.flat()));
      }),
    );
  }

  /** How many litters there are, read off the first page that answers. */
  private countFamilies(params: SingleRecordParams): Observable<number> {
    return from(PROBE_PAGES).pipe(
      concatMap((page) =>
        this.getFamilies({ ...params, page, perPage: 1 }).pipe(
          map((response) => response.pagination.totalItems),
          // -1 rather than 0, so a page that failed is told apart from a
          // catalogue that genuinely has no litters and stops the probe.
          catchError(() => of(-1)),
        ),
      ),
      first((total) => total >= 0, 0),
    );
  }
}
