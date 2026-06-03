import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { KittensService, type KittenApiItem } from '../kittens/kittens.service';
import { I18nService } from '../../services/i18n.service';
import { resolveDisplayName } from '../../services/translit.util';
import { formatAge } from '../../services/age.util';

interface PhilosophyPoint {
  textKey: string;
}

interface WhyItem {
  icon: string;
  titleKey: string;
  textKey: string;
}

interface Review {
  id: number;
  nameKey: string;
  cityKey: string;
  textKey: string;
  stars: number;
  avatar: string;
}

interface ContactItem {
  icon: string;
  labelKey: string;
  link: string;
  value: string;
}

interface CarouselKitten {
  id: string;
  name: string;
  image: string;
  age: string | null;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1518288774672-b94e808873ff?auto=format&fit=crop&w=1200&q=80';

const CAROUSEL_LIMIT = 10;

@Component({
  selector: 'app-home',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly kittensService = inject(KittensService);
  protected readonly i18n = inject(I18nService);

  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  private readonly rawCarousel = toSignal(
    this.kittensService.getKittens({ perPage: 50 }).pipe(
      map((response) => response.data ?? []),
      catchError(() => of<KittenApiItem[]>([])),
    ),
    { initialValue: [] as KittenApiItem[] },
  );

  /** Up to the 10 most recently added kittens, localized for the active language. */
  protected readonly carouselKittens = computed<CarouselKitten[]>(() => {
    const lang = this.i18n.language$();
    const ageLabels = { mo: this.i18n.t('ageMonthsShort'), d: this.i18n.t('ageDaysShort') };
    return [...this.rawCarousel()]
      .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
      .slice(0, CAROUSEL_LIMIT)
      .map((k) => ({
        id: k._id,
        name: resolveDisplayName(k.nameUa, k.nameEn, lang, this.i18n.t('kittenFallbackName')),
        image: pickMainImage(k.images),
        age: formatAge(k.birthDay, ageLabels),
      }));
  });

  philosophyPoints: PhilosophyPoint[] = [
    { textKey: 'homePhilosophyPoint1' },
    { textKey: 'homePhilosophyPoint2' },
    { textKey: 'homePhilosophyPoint3' },
  ];

  whyItems: WhyItem[] = [
    { icon: '🏠', titleKey: 'homeWhy1Title', textKey: 'homeWhy1Text' },
    { icon: '🩺', titleKey: 'homeWhy2Title', textKey: 'homeWhy2Text' },
    { icon: '💜', titleKey: 'homeWhy3Title', textKey: 'homeWhy3Text' },
    { icon: '📋', titleKey: 'homeWhy4Title', textKey: 'homeWhy4Text' },
  ];

  reviews: Review[] = [
    {
      id: 1,
      nameKey: 'homeReview1Name',
      cityKey: 'homeReview1City',
      textKey: 'homeReview1Text',
      stars: 5,
      avatar: 'A',
    },
    {
      id: 2,
      nameKey: 'homeReview2Name',
      cityKey: 'homeReview2City',
      textKey: 'homeReview2Text',
      stars: 5,
      avatar: 'D',
    },
    {
      id: 3,
      nameKey: 'homeReview3Name',
      cityKey: 'homeReview3City',
      textKey: 'homeReview3Text',
      stars: 5,
      avatar: 'O',
    },
  ];

  contacts: ContactItem[] = [
    {
      icon: '💬',
      labelKey: 'homeContactTelegramLabel',
      link: 'https://t.me/arlen_fluffy_plush',
      value: '@arlen_fluffy_plush',
    },
    {
      icon: '📱',
      labelKey: 'homeContactWhatsappLabel',
      link: 'tel:+380991234567',
      value: '+38 (099) 123-45-67',
    },
    {
      icon: '📧',
      labelKey: 'homeContactEmailLabel',
      link: 'mailto:hello@arlen-fluffy.com',
      value: 'hello@arlen-fluffy.com',
    },
  ];

  getReviewStars(stars: number): number[] {
    return Array(stars).fill(0);
  }

  protected scrollByCards(direction: -1 | 1): void {
    if (typeof document === 'undefined') return;
    const el = this.scroller()?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' });
  }
}

function toTimestamp(value: string | undefined): number {
  const parsed = Date.parse(value ?? '');
  return Number.isNaN(parsed) ? 0 : parsed;
}

function pickMainImage(
  images: readonly { full: string; isMain?: boolean }[] | undefined,
): string {
  if (!images || images.length === 0) return FALLBACK_IMAGE;
  return images.find((i) => i.isMain)?.full ?? images[0].full ?? FALLBACK_IMAGE;
}
