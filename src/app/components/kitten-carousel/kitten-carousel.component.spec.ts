import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import type { KittenApiItem } from '../../pages/kittens/kittens.service';
import { KittenCarouselComponent } from './kitten-carousel.component';

function kitten(index: number): KittenApiItem {
  return {
    _id: `id-${index}`,
    nameUa: `Кошеня ${index}`,
    nameEn: `Kitten ${index}`,
    breed: 'Британська',
    color: 'блакитний',
    sex: index % 2 === 0 ? 'male' : 'female',
    birthDay: '2026-06-11T00:00:00.000Z',
    images: [{ full: `https://images.example.com/${index}.jpg`, isMain: true }],
    parentId: { mom: 'mom-1', dad: 'dad-1' },
  };
}

describe('KittenCarouselComponent', () => {
  let fixture: ComponentFixture<KittenCarouselComponent>;
  let http: HttpTestingController;

  const host = () => fixture.nativeElement as HTMLElement;
  const cards = () => Array.from(host().querySelectorAll('article.kitten-card'));
  /**
   * The card's link. It is the name inside the card rather than the card
   * itself: the photo is a small gallery now, and its arrows and dots are
   * buttons, which cannot sit inside a link.
   */
  const cardLinks = () =>
    Array.from(host().querySelectorAll('a.kitten-card__link')) as HTMLAnchorElement[];
  const arrows = () =>
    Array.from(host().querySelectorAll('button.kitten-carousel__arrow')) as HTMLButtonElement[];
  const track = () => host().querySelector('ul.kitten-carousel__track') as HTMLElement | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(I18nService).setLanguage('uk');
    fixture = TestBed.createComponent(KittenCarouselComponent);
  });

  afterEach(() => {
    http.verify();
  });

  function page<T>(data: T[]) {
    return {
      data,
      pagination: {
        page: 1,
        perPage: 1000,
        totalItems: data.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  /** Answers the litter listing, which only decides the order of the strip. */
  function flushFamilies(families: unknown[] = []): void {
    http.expectOne((candidate) => candidate.url.includes('/families')).flush(page(families));
  }

  /**
   * Fails the litter listing outright. `getAllFamilies` falls back to reading
   * it one record at a time when the whole-list request fails, so the failure
   * has to be handed to every request that fallback goes on to make.
   */
  async function failFamilies(): Promise<void> {
    for (let guard = 0; guard < 20; guard += 1) {
      await fixture.whenStable();
      const pending = http.match((candidate) => candidate.url.includes('/families'));
      if (pending.length === 0) {
        return;
      }

      for (const request of pending) {
        request.error(new ProgressEvent('error'));
      }
    }
  }

  async function respondWith(count: number): Promise<void> {
    await fixture.whenStable();
    const request = http.expectOne((candidate) => candidate.url.includes('/cats/kittens'));
    // The whole catalogue, because the ten shown are its head in its own
    // order rather than the first ten records the API happens to return.
    expect(request.request.params.get('perPage')).toBe('1000');
    request.flush(page(Array.from({ length: count }, (_, index) => kitten(index))));
    flushFamilies();
    await fixture.whenStable();
  }

  it('reads the whole catalogue and renders ten of it', async () => {
    await respondWith(10);
    expect(cards().length).toBe(10);
  });

  it('shows the head of the catalogue in the catalogue’s own litter order', async () => {
    await fixture.whenStable();
    http
      .expectOne((candidate) => candidate.url.includes('/cats/kittens'))
      .flush(
        page([
          { ...kitten(0), familyId: 'late' },
          { ...kitten(1), familyId: 'early' },
          { ...kitten(2), familyId: 'early' },
        ]),
      );
    http.expectOne((candidate) => candidate.url.includes('/families')).flush(
      page([
        { _id: 'late', name: 'B', displayOrder: 7, parents: { mom: null, dad: null }, kittens: [] },
        {
          _id: 'early',
          name: 'A',
          displayOrder: 1,
          parents: { mom: null, dad: null },
          // The litter's own list is what orders the kittens inside it.
          kittens: ['id-2', 'id-1'],
        },
      ]),
    );
    await fixture.whenStable();

    expect(cardLinks().map((link) => link.getAttribute('href'))).toEqual([
      '/uk/kittens/id-2',
      '/uk/kittens/id-1',
      '/uk/kittens/id-0',
    ]);
  });

  it('still renders the strip when the litter listing cannot be read', async () => {
    await fixture.whenStable();
    http
      .expectOne((candidate) => candidate.url.includes('/cats/kittens'))
      .flush(page([kitten(0), kitten(1)]));
    await failFamilies();

    expect(cards().length).toBe(2);
    expect(host().querySelector('.kitten-carousel__notice')).toBeNull();
  });

  it('never renders more than ten even if the API returns more', async () => {
    await respondWith(25);
    expect(cards().length).toBe(10);
  });

  it('renders fewer when that is all there is', async () => {
    await respondWith(3);
    expect(cards().length).toBe(3);
  });

  it('sends every card to its own kitten page under the language prefix', async () => {
    await respondWith(2);
    expect(cardLinks().map((link) => link.getAttribute('href'))).toEqual([
      '/uk/kittens/id-0',
      '/uk/kittens/id-1',
    ]);
  });

  it('names the kitten in each card label', async () => {
    await respondWith(1);
    // Nothing has set a status, so there is no state to name: the site says
    // nothing about a kitten the cattery has said nothing about.
    expect(cardLinks()[0].getAttribute('aria-label')).toBe('Кошеня 0, Британська');
    expect(host().querySelector('.status-pill')).toBeNull();
  });

  it('shows the sale state on the card, and says it in the card label', async () => {
    await fixture.whenStable();
    http
      .expectOne((candidate) => candidate.url.includes('/cats/kittens'))
      .flush(page([{ ...kitten(0), status: 'booked' }]));
    flushFamilies();
    await fixture.whenStable();

    const pill = host().querySelector('.status-pill');
    expect(pill?.textContent?.trim()).toBe('Зарезервоване');
    expect(pill?.classList.contains('status-pill--reserved')).toBe(true);
    // The label replaces the text inside the link, so it has to carry the
    // state itself or a screen reader never hears the pill.
    expect(cardLinks()[0].getAttribute('aria-label')).toBe(
      'Кошеня 0, Британська, Зарезервоване',
    );
  });

  it('is a labelled list of links, with hidden decorative icons', async () => {
    await respondWith(4);

    const group = host().querySelector('.kitten-carousel');
    expect(group?.getAttribute('role')).toBe('group');
    expect(group?.getAttribute('aria-label')).toBeTruthy();
    expect(group?.getAttribute('aria-roledescription')).toBeTruthy();

    expect(track()?.tagName).toBe('UL');
    expect(host().querySelectorAll('li.kitten-carousel__item').length).toBe(4);

    for (const arrow of arrows()) {
      expect(arrow.getAttribute('aria-label')).toBeTruthy();
      expect(arrow.getAttribute('type')).toBe('button');
    }

    for (const svg of Array.from(host().querySelectorAll('svg'))) {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.getAttribute('focusable')).toBe('false');
    }

    // Keyboard users reach the scroller through the card links themselves.
    expect(cardLinks().length).toBe(cards().length);
    expect(cardLinks().every((link) => link.hasAttribute('href'))).toBe(true);
  });

  it('shows a message instead of an empty strip when there are no kittens', async () => {
    await respondWith(0);

    expect(cards().length).toBe(0);
    const notice = host().querySelector('.kitten-carousel__notice');
    expect(notice?.getAttribute('role')).toBe('status');
    expect(notice?.textContent?.trim()).toBeTruthy();
  });

  it('reports a failed load instead of rendering an empty carousel', async () => {
    await fixture.whenStable();
    // Answered first, so the kittens are what the strip is missing.
    flushFamilies();
    http
      .expectOne((candidate) => candidate.url.includes('/cats/kittens'))
      .error(new ProgressEvent('error'));
    await fixture.whenStable();

    const notice = host().querySelector('.kitten-carousel__notice');
    expect(notice?.getAttribute('role')).toBe('alert');
    expect(cards().length).toBe(0);
  });

  it('enables and disables the arrows from the measured scroll position', async () => {
    await respondWith(10);

    const element = track();
    if (!element) throw new Error('no track');

    // jsdom performs no layout, so the metrics are supplied directly.
    const setMetrics = (scrollLeft: number) => {
      Object.defineProperty(element, 'scrollWidth', { value: 3000, configurable: true });
      Object.defineProperty(element, 'clientWidth', { value: 900, configurable: true });
      Object.defineProperty(element, 'scrollLeft', { value: scrollLeft, configurable: true });
      element.dispatchEvent(new Event('scroll'));
    };

    const [prev, next] = arrows();

    setMetrics(0);
    await fixture.whenStable();
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(false);

    setMetrics(500);
    await fixture.whenStable();
    expect(prev.disabled).toBe(false);
    expect(next.disabled).toBe(false);

    setMetrics(2100);
    await fixture.whenStable();
    expect(prev.disabled).toBe(false);
    expect(next.disabled).toBe(true);
  });

  it('scrolls by most of a screen when an arrow is pressed', async () => {
    await respondWith(10);

    const element = track();
    if (!element) throw new Error('no track');
    Object.defineProperty(element, 'clientWidth', { value: 900, configurable: true });
    Object.defineProperty(element, 'scrollWidth', { value: 3000, configurable: true });
    Object.defineProperty(element, 'scrollLeft', { value: 400, configurable: true });
    element.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();

    const scrollBy = vi.fn();
    element.scrollBy = scrollBy as unknown as typeof element.scrollBy;

    const [prev, next] = arrows();
    next.click();
    expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 810 }));

    prev.click();
    expect(scrollBy).toHaveBeenLastCalledWith(expect.objectContaining({ left: -810 }));
  });

  it('shows the kitten copy in the active language', async () => {
    TestBed.inject(I18nService).setLanguage('en');
    await respondWith(1);

    const card = cards()[0];
    expect(card.textContent).toContain('Male');
    expect(card.querySelector('img')?.getAttribute('src')).toBe('https://images.example.com/0.jpg');
    expect(card.querySelector('img')?.getAttribute('loading')).toBe('lazy');
  });
});
