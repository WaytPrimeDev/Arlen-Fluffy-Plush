import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { LocalizedPathPipe } from '../../pipes/localized-path.pipe';
import { ImageFallbackDirective } from '../image-fallback/image-fallback.directive';
import { breedCover, breedSlug, taxonomyName, type BreedRef } from '../../services/taxonomy';
import { scaledImage } from '../../services/image-url.util';

/** Cover for the tile that leads back to the whole catalogue. */
const ALL_BREEDS_COVER = '/assets/img/family.webp';

/** Wide enough for the tile on a retina screen, small enough to stay cheap. */
const TILE_WIDTH = 560;

interface BreedTile {
  /** `null` on the tile that stands for every breed at once. */
  slug: string | null;
  name: string;
  image: string;
  active: boolean;
}

/**
 * The breed picker at the top of the catalogue: one photo tile per breed, plus
 * a tile for the unfiltered list. Each tile is a link to its own URL rather
 * than a filter, so a breed is a page a visitor can land on from search and
 * share, and the listing below it is whatever that URL names.
 *
 * A breed the backend has not given a slug yet is left out: it has no page to
 * link to, and the breed filter in the toolbar still reaches those kittens.
 */
@Component({
  selector: 'app-breed-tiles',
  imports: [RouterLink, LocalizedPathPipe, ImageFallbackDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Nothing to pick from until the API serves breeds with slugs: a picker
         holding only the "all kittens" tile is noise, so it stays hidden. -->
    @if (hasBreeds()) {
      <nav class="breed-tiles" [attr.aria-label]="i18n.t('browseByBreed')">
        <h2 class="breed-tiles__title">{{ i18n.t('browseByBreed') }}</h2>

        <ul class="breed-tiles__list">
          @for (tile of tiles(); track tile.slug) {
            <li class="breed-tiles__item">
              <a
                class="breed-tile"
                [class.breed-tile--active]="tile.active"
                [routerLink]="(tile.slug ? ['/breeds', tile.slug] : '/kittens') | locPath"
                [attr.aria-current]="tile.active ? 'page' : null"
              >
                <img
                  class="breed-tile__image"
                  draggable="false"
                  decoding="async"
                  loading="lazy"
                  appImageFallback
                  [src]="tile.image"
                  alt=""
                  aria-hidden="true"
                />
                <span class="breed-tile__label">{{ tile.name }}</span>
              </a>
            </li>
          }
        </ul>
      </nav>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .breed-tiles {
      margin: 0 0 2.25rem;
    }

    .breed-tiles__title {
      margin: 0 0 1rem;
      font-family: 'Playfair Display', serif;
      font-size: clamp(1.25rem, 3vw, 1.6rem);
      color: var(--text-primary);
    }

    .breed-tiles__list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .breed-tile {
      position: relative;
      display: block;
      aspect-ratio: 4 / 3;
      overflow: hidden;
      border-radius: 18px;
      border: 2px solid transparent;
      background: var(--brand-light);
      text-decoration: none;
      transition:
        transform 0.25s ease,
        box-shadow 0.25s ease,
        border-color 0.25s ease;
    }

    .breed-tile__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.45s ease;
    }

    /* A solid scrim rather than a translucent wash: the label has to stay
       readable over a white cat and over a dark one alike. */
    .breed-tile__label {
      position: absolute;
      inset: auto 0 0;
      padding: 1.75rem 0.85rem 0.7rem;
      background: linear-gradient(180deg, rgb(28 24 39 / 0%) 0%, rgb(28 24 39 / 92%) 55%);
      color: #fff;
      font-weight: 600;
      font-size: 0.95rem;
      line-height: 1.3;
      text-align: center;
    }

    .breed-tile:hover,
    .breed-tile:focus-visible {
      transform: translateY(-3px);
      box-shadow: 0 14px 30px rgb(28 24 39 / 18%);
    }

    .breed-tile:hover .breed-tile__image {
      transform: scale(1.05);
    }

    .breed-tile:focus-visible {
      outline: 3px solid var(--brand-purple);
      outline-offset: 2px;
    }

    .breed-tile--active {
      border-color: var(--brand-purple);
      box-shadow: 0 10px 24px rgb(115 86 168 / 28%);
    }

    @media (prefers-reduced-motion: reduce) {
      .breed-tile,
      .breed-tile__image {
        transition: none;
      }

      .breed-tile:hover,
      .breed-tile:focus-visible {
        transform: none;
      }

      .breed-tile:hover .breed-tile__image {
        transform: none;
      }
    }

    @media (width <= 520px) {
      .breed-tiles__list {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 0.75rem;
      }

      .breed-tile {
        border-radius: 14px;
      }

      .breed-tile__label {
        font-size: 0.85rem;
      }
    }
  `,
})
export class BreedTilesComponent {
  protected readonly i18n = inject(I18nService);

  readonly breeds = input<readonly BreedRef[]>([]);
  /** The breed whose page is open, or null on the unfiltered catalogue. */
  readonly activeSlug = input<string | null>(null);

  /** False while no breed has a page to link to, which hides the picker. */
  protected readonly hasBreeds = computed(() => this.tiles().length > 1);

  protected readonly tiles = computed<BreedTile[]>(() => {
    const active = this.activeSlug();

    const breedTiles = this.breeds()
      .map((breed): BreedTile | null => {
        const slug = breedSlug(breed);
        if (!slug) {
          return null;
        }

        const cover = breedCover(breed);
        return {
          slug,
          name: taxonomyName(breed, this.i18n, this.i18n.t('fallbackNoBreed')),
          image: cover ? scaledImage(cover, TILE_WIDTH) : ALL_BREEDS_COVER,
          active: slug === active,
        };
      })
      .filter((tile): tile is BreedTile => tile !== null);

    return [
      {
        slug: null,
        name: this.i18n.t('allBreedsTile'),
        image: ALL_BREEDS_COVER,
        active: active === null,
      },
      ...breedTiles,
    ];
  });
}
