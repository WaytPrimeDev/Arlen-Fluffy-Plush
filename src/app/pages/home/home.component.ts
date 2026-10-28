import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KittenCarouselComponent } from '../../components/kitten-carousel/kitten-carousel.component';
import { I18nService } from '../../services/i18n.service';
import { LocalizedPathPipe } from '../../pipes/localized-path.pipe';

interface WhyItem {
  icon: string;
  title: string;
  text: string;
}

interface Review {
  id: number;
  name: string;
  city: string;
  text: string;
  stars: number;
  avatar: string;
}

interface ContactItem {
  icon: string;
  label: string;
  link: string;
  value: string;
}

/** Three hard-coded stars per review; the copy itself comes from the dictionary. */
const REVIEW_STARS = 5;

@Component({
  selector: 'app-home',
  imports: [RouterLink, KittenCarouselComponent, LocalizedPathPipe, NgOptimizedImage],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly i18n = inject(I18nService);

  /**
   * Every list on this page is derived from the dictionary, so switching the
   * language re-renders the copy instead of leaving one language behind.
   */
  protected readonly philosophyPoints = computed<string[]>(() => [
    this.i18n.t('homePhilosophyPoint1'),
    this.i18n.t('homePhilosophyPoint2'),
    this.i18n.t('homePhilosophyPoint3'),
  ]);

  protected readonly whyItems = computed<WhyItem[]>(() => [
    { icon: '🏠', title: this.i18n.t('homeWhy1Title'), text: this.i18n.t('homeWhy1Text') },
    { icon: '🩺', title: this.i18n.t('homeWhy2Title'), text: this.i18n.t('homeWhy2Text') },
    { icon: '💜', title: this.i18n.t('homeWhy3Title'), text: this.i18n.t('homeWhy3Text') },
    { icon: '📋', title: this.i18n.t('homeWhy4Title'), text: this.i18n.t('homeWhy4Text') },
  ]);

  protected readonly reviews = computed<Review[]>(() =>
    [1, 2, 3].map((id) => {
      const name = this.i18n.t(`homeReview${id}Name`);
      return {
        id,
        name,
        city: this.i18n.t(`homeReview${id}City`),
        text: this.i18n.t(`homeReview${id}Text`),
        stars: REVIEW_STARS,
        avatar: name.charAt(0),
      };
    }),
  );

  protected readonly contacts: readonly ContactItem[] = [
    {
      icon: '💬',
      label: 'Telegram',
      link: 'https://t.me/kittensarlenfluffyplush',
      value: '@arlenfluffyplush',
    },
    {
      icon: '📱',
      label: 'WhatsApp',
      link: 'tel:+380991234567',
      value: '+38 (099) 123-45-67',
    },
    {
      icon: '📧',
      label: 'Email',
      link: 'mailto:hello@arlen-fluffy.com',
      value: 'hello@arlen-fluffy.com',
    },
  ];

  protected getReviewStars(stars: number): number[] {
    return Array(stars).fill(0);
  }
}
