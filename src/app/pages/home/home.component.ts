import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';

interface NavLink {
  label: string;
  href: string;
}

interface Kitten {
  id: number;
  name: string;
  breed: string;
  color: string;
  age: string;
  price: string;
  img: string;
  badge: string;
  badgeColor: string;
}

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
  menuOpen = false;
  isScrolled = false;
  activeKittenId: number | null = null;

  navLinks: NavLink[] = [
    { label: 'О питомнике', href: '#about' },
    { label: 'Котята', href: '#kittens' },
    { label: 'Философия', href: '#philosophy' },
    { label: 'Отзывы', href: '#reviews' },
  ];

  philosophyPoints: string[] = [
    'Встречает у двери каждый день',
    'Создает атмосферу уюта без усилий',
    'Слышит вас, когда никто другой не слышит',
  ];

  kittens: Kitten[] = [
    {
      id: 1,
      name: 'Луна',
      breed: 'Шотландская вислоухая',
      color: 'Серебристо-белая',
      age: '3 месяца',
      price: '45 000 UAH',
      img: 'https://images.unsplash.com/photo-1773782285485-70dd6ddaeefd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwa2l0dGVuJTIwd2hpdGUlMjBmbHVmZnklMjBjbG9zZSUyMHVwfGVufDF8fHx8MTc3ODE0NzU1OXww&ixlib=rb-4.1.0&q=80&w=800',
      badge: 'Доступна',
      badgeColor: '#4CAF82',
    },
    {
      id: 2,
      name: 'Граф',
      breed: 'Британская короткошерстная',
      color: 'Голубой',
      age: '2.5 месяца',
      price: '55 000 UAH',
      img: 'https://images.unsplash.com/photo-1561047845-68d8fbabd26f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicml0aXNoJTIwc2hvcnRoYWlyJTIwa2l0dGVuJTIwYmx1ZSUyMGdyYXl8ZW58MXx8fHwxNzc4MTQ3NTY1fDA&ixlib=rb-4.1.0&q=80&w=800',
      badge: 'Доступен',
      badgeColor: '#4CAF82',
    },
    {
      id: 3,
      name: 'Ирис',
      breed: 'Персидская',
      color: 'Кремовая',
      age: '3.5 месяца',
      price: '60 000 UAH',
      img: 'https://images.unsplash.com/photo-1681137617949-5b0078e67cce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzaWFuJTIwa2l0dGVuJTIwcG9ydHJhaXQlMjBzdHVkaW98ZW58MXx8fHwxNzc4MTQ3NTU5fDA&ixlib=rb-4.1.0&q=80&w=800',
      badge: 'Резерв',
      badgeColor: '#F5A623',
    },
    {
      id: 4,
      name: 'Тоби',
      breed: 'Шотландская вислоухая',
      color: 'Темно-серый',
      age: '2 месяца',
      price: '50 000 UAH',
      img: 'https://images.unsplash.com/photo-1761473060416-942247cd68f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY290dGlzaCUyMGZvbGQlMjBraXR0ZW4lMjBjdXRlJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc4MTQ3NTY0fDA&ixlib=rb-4.1.0&q=80&w=800',
      badge: 'Доступен',
      badgeColor: '#4CAF82',
    },
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

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 40;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  setActiveKitten(id: number | null): void {
    this.activeKittenId = id;
  }

  getReviewStars(stars: number): number[] {
    return Array(stars).fill(0);
  }
}
