import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

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

interface FooterColumn {
  title: string;
  links: string[];
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  activeKittenId: number | null = null;

  philosophyPoints: string[] = [
    'Встречает у двери каждый день',
    'Создает атмосферу уюта без усилий',
    'Слышит вас, когда никто другой не слышит',
  ];

  whyItems: WhyItem[] = [
    {
      icon: '🏠',
      title: 'Рождены дома',
      text: 'Котята растут в квартире с первого дня - никаких клеток, только тепло и забота.',
    },
    {
      icon: '🩺',
      title: 'Здоровье на 100%',
      text: 'Ветеринарные справки, прививки, чипирование и генетические тесты родителей.',
    },
    {
      icon: '💜',
      title: 'Поддержка навсегда',
      text: 'Мы остаемся на связи - консультируем по питанию, здоровью и воспитанию.',
    },
    {
      icon: '📋',
      title: 'Документы WCF',
      text: 'Метрики и родословные международного стандарта для каждого котенка.',
    },
  ];

  reviews: Review[] = [
    {
      id: 1,
      name: 'Анастасия М.',
      city: 'Львов',
      text: 'Взяли Луну два года назад. Теперь без нее невозможно представить наш дом. Она встречает нас с работы, спит с нами и знает по имени каждого.',
      stars: 5,
      avatar: 'А',
    },
    {
      id: 2,
      name: 'Дмитрий К.',
      city: 'Харьков',
      text: 'Сначала жена долго уговаривала. Теперь я сам не могу без нашего Графа. Это что-то большее, чем питомец - это маленькая личность.',
      stars: 5,
      avatar: 'Д',
    },
    {
      id: 3,
      name: 'Ольга Р.',
      city: 'Вильнюс',
      text: 'Питомник с душой. Котята здоровые, социализированные, сразу адаптировались. Помогли выбрать подходящего именно для нашей семьи.',
      stars: 5,
      avatar: 'О',
    },
  ];

  contacts: ContactItem[] = [
    {
      icon: '💬',
      label: 'Telegram',
      link: 'https://t.me/arlen_fluffy_plush',
      value: '@arlen_fluffy_plush',
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

  footerColumns: FooterColumn[] = [
    {
      title: 'Питомник',
      links: ['О нас', 'Породы', 'Родители', 'Галерея'],
    },
    {
      title: 'Котята',
      links: ['Все котята', 'Резервирование', 'Документы', 'Доставка'],
    },
    {
      title: 'Связь',
      links: ['Telegram', 'WhatsApp', 'Instagram', 'Email'],
    },
  ];

  setActiveKitten(id: number | null): void {
    this.activeKittenId = id;
  }

  getReviewStars(stars: number): number[] {
    return Array(stars).fill(0);
  }
}
