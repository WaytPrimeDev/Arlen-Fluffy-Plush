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
  const cards = () => Array.from(host().querySelectorAll('a.kitten-card'));
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

  async function respondWith(count: number): Promise<void> {
    await fixture.whenStable();
    const request = http.expectOne((candidate) => candidate.url.includes('/cats/kittens'));
    expect(request.request.params.get('perPage')).toBe('10');
    request.flush({
      data: Array.from({ length: count }, (_, index) => kitten(index)),
      pagination: {
        page: 1,
        perPage: 10,
        totalItems: count,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });
    await fixture.whenStable();
  }

  it('asks the API for ten and renders ten', async () => {
    await respondWith(10);
    expect(cards().length).toBe(10);
  });

  it('never renders more than ten even if the API returns more', async () => {
    await respondWith(25);
    expect(cards().length).toBe(10);
  });

  it('renders fewer when that is all there is', async () => {
    await respondWith(3);
    expect(cards().length).toBe(3);
  });

  it('sends every card to the catalogue under the language prefix', async () => {
    await respondWith(2);
    expect(cards().map((card) => card.getAttribute('href'))).toEqual([
      '/uk/kittens',
      '/uk/kittens',
    ]);
  });

  it('names the catalogue in each card label, since that is where it goes', async () => {
    await respondWith(1);
    expect(cards()[0].getAttribute('aria-label')).toBe(
      'Кошеня 0, Британська — Дивитися всіх кошенят',
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
    expect(cards().every((card) => card.tagName === 'A' && card.hasAttribute('href'))).toBe(true);
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
