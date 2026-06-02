import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

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

@Component({
  selector: 'app-home',
  imports: [TranslatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
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

<<<<<<< HEAD
=======
  setActiveKitten(id: number | null): void {
    this.activeKittenId = id;
  }

>>>>>>> f9e94954a118afdbd9fb2809f0de949b9977dae5
  getReviewStars(stars: number): number[] {
    return Array(stars).fill(0);
  }
}
