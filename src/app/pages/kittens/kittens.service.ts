import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { I18nService } from '../../services/i18n.service';
import type { ListParams, PaginatedResponse } from '../../services/filters.service';
import { buildListParams } from '../../services/http-params.util';
import { API_PATH } from '../../services/api';
import type { BreedRef, ColorRef, MaybeRef } from '../../services/taxonomy';
import { isObjectId } from '../../services/cat-route.util';

export interface KittenImage {
  full: string;
  mobile?: string;
  thumbnail?: string;
  isMain?: boolean;
}

export interface KittenPrice {
  breeding?: string;
  pet?: string;
}

export interface KittenParentRef {
  mom: string | null;
  dad: string | null;
}

export interface KittenApiItem {
  _id: string;
  /**
   * The kitten's own URL segment, minted by the backend from `nameEn`. The
   * public pages address a kitten by id; this is here because the API sends it.
   */
  slug?: string | null;
  nameUa?: string;
  nameEn?: string;
  /** Dictionary reference with the name already joined in; may be null. */
  breed?: MaybeRef<BreedRef>;
  color?: MaybeRef<ColorRef>;
  sex?: string;
  status?: string;
  birthDay?: string;
  images?: KittenImage[];
  price?: KittenPrice;
  parentId?: KittenParentRef;
  /** The litter the kitten belongs to; how the API ties a kitten to a family. */
  familyId?: string | null;
  /**
   * The id of the kitten's YouTube video, or null when it has none. The API
   * stores an id rather than a URL: the admin side accepts links in half a
   * dozen shapes, and normalizing them once on write keeps every reader from
   * having to parse them. `videoUrlUtil.kittenVideo` builds the player,
   * poster and watch URLs from it.
   */
  videoId?: string | null;
}

export interface KittenDisplayItem extends KittenApiItem {
  name: string;
}

interface KittenApiResponse {
  data: KittenApiItem;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class KittensService {
  private readonly apiUrl = API_PATH;
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);

  getKittens(params: ListParams = {}): Observable<PaginatedResponse<KittenApiItem>> {
    return this.http.get<PaginatedResponse<KittenApiItem>>(`${this.apiUrl}/cats/kittens`, {
      params: buildListParams(params),
    });
  }

  /**
   * One kitten, addressed by whichever key the URL carries.
   *
   * The two endpoints exist because slugs were added to a site that had
   * already been indexed by id: `/cats/kitten/slug/:slug` serves the public
   * URLs, and `/cats/kitten/:id` keeps every link minted before them alive.
   * A 24-hex segment can only be an `_id` — a slug is lower-case words joined
   * by hyphens — so the shape of the value decides, and nothing has to be
   * tried twice.
   */
  getKitten(param: string): Observable<KittenApiItem> {
    const path = isObjectId(param)
      ? `${this.apiUrl}/cats/kitten/${encodeURIComponent(param)}`
      : `${this.apiUrl}/cats/kitten/slug/${encodeURIComponent(param)}`;

    return this.http.get<KittenApiResponse>(path).pipe(map((response) => response.data));
  }

  /**
   * Get the localized name for a kitten based on current language
   */
  getLocalizedName(kitten: KittenApiItem): string {
    const lang = this.i18n.getLanguage();
    return lang === 'uk'
      ? kitten.nameUa || kitten.nameEn || ''
      : kitten.nameEn || kitten.nameUa || '';
  }

  /**
   * Map kitten items with localized names
   */
  mapWithLocalizedNames(kittens: KittenApiItem[]): KittenDisplayItem[] {
    return kittens.map((kitten) => ({
      ...kitten,
      name: this.getLocalizedName(kitten),
    }));
  }
}
