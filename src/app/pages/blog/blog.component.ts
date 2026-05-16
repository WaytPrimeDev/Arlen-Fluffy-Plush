import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  image: string;
  category: string;
}

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogComponent {
  protected readonly posts: BlogPost[] = [
    {
      id: '1',
      title: 'Как выбрать идеального британского котенка',
      excerpt: 'Советы для новичков по выбору здорового и дружелюбного котенка',
      date: '15 мая 2026',
      author: 'Ольга',
      image: 'https://images.unsplash.com/photo-1574158622147-08a9b37261a7?auto=format&fit=crop&w=600&q=80',
      category: 'Советы',
    },
    {
      id: '2',
      title: 'Уход за длинной шерстью кошек',
      excerpt: 'Полное руководство по уходу за шерстью ваших пушистых друзей',
      date: '12 мая 2026',
      author: 'Маша',
      image: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=600&q=80',
      category: 'Уход',
    },
    {
      id: '3',
      title: 'Особенности характера британских кошек',
      excerpt: 'Узнайте, почему британские кошки такие особенные и уникальные',
      date: '10 мая 2026',
      author: 'Дмитрий',
      image: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?auto=format&fit=crop&w=600&q=80',
      category: 'Породы',
    },
    {
      id: '4',
      title: 'Питание котенка: здоровье с первых дней',
      excerpt: 'Как правильно кормить котенка для его здоровья и развития',
      date: '8 мая 2026',
      author: 'Маша',
      image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=80',
      category: 'Питание',
    },
    {
      id: '5',
      title: 'Адаптация котенка в новом доме',
      excerpt: 'Пошаговое руководство для безстрессовой адаптации котенка',
      date: '5 мая 2026',
      author: 'Дмитрий',
      image: 'https://images.unsplash.com/photo-1523266635335-684c5b6fe213?auto=format&fit=crop&w=600&q=80',
      category: 'Советы',
    },
    {
      id: '6',
      title: 'Здоровье кошек: профилактика и вакцинация',
      excerpt: 'Важная информация о профилактических мерах для здоровья вашего питомца',
      date: '2 мая 2026',
      author: 'Маша',
      image: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=600&q=80',
      category: 'Здоровье',
    },
  ];
}
