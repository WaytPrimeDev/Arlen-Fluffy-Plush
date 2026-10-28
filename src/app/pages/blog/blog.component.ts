import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { dateLocale } from '../../services/kitten-view.util';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  image: string;
  category: string;
}

/**
 * The copy of every post lives in the dictionary; only what cannot be
 * translated — the publication date and the photo — is kept here.
 */
const POST_SOURCES = [
  {
    id: '1',
    publishedOn: '2026-05-15',
    authorKey: 'blogAuthor1',
    categoryKey: 'blogCatTips',
    image:
      'https://images.unsplash.com/photo-1574158622147-08a9b37261a7?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '2',
    publishedOn: '2026-05-12',
    authorKey: 'blogAuthor2',
    categoryKey: 'blogCatCare',
    image:
      'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '3',
    publishedOn: '2026-05-10',
    authorKey: 'blogAuthor3',
    categoryKey: 'blogCatBreeds',
    image:
      'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '4',
    publishedOn: '2026-05-08',
    authorKey: 'blogAuthor2',
    categoryKey: 'blogCatNutrition',
    image:
      'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '5',
    publishedOn: '2026-05-05',
    authorKey: 'blogAuthor3',
    categoryKey: 'blogCatTips',
    image:
      'https://images.unsplash.com/photo-1523266635335-684c5b6fe213?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '6',
    publishedOn: '2026-05-02',
    authorKey: 'blogAuthor2',
    categoryKey: 'blogCatHealth',
    image:
      'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=600&q=80',
  },
] as const;

/** How many posts the "popular" strip repeats at the bottom of the page. */
const FEATURED_COUNT = 3;

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogComponent {
  protected readonly i18n = inject(I18nService);

  protected readonly posts = computed<BlogPost[]>(() =>
    POST_SOURCES.map((source) => ({
      id: source.id,
      title: this.i18n.t(`blogPost${source.id}Title`),
      excerpt: this.i18n.t(`blogPost${source.id}Excerpt`),
      date: new Date(source.publishedOn).toLocaleDateString(dateLocale(this.i18n), {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      author: this.i18n.t(source.authorKey),
      image: source.image,
      category: this.i18n.t(source.categoryKey),
    })),
  );

  protected readonly featuredPosts = computed(() => this.posts().slice(0, FEATURED_COUNT));
}
