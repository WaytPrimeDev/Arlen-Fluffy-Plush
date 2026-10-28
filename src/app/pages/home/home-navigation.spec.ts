import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from '../../app';
import { routes } from '../../app.routes';
import { I18nService } from '../../services/i18n.service';

const KITTEN_ID = '6a2983fe8232ff7b53b2be16';

/**
 * The home page is a shop window: every kitten on it opens the catalogue, so
 * visitors browse the full list rather than landing on one kitten.
 */
describe('home page navigation', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;
  let http: HttpTestingController;

  const host = () => fixture.nativeElement as HTMLElement;
  const kittenCards = () =>
    Array.from(host().querySelectorAll('a.kitten-card')) as HTMLAnchorElement[];
  const buttons = () =>
    Array.from(host().querySelectorAll('.landing a.button')) as HTMLAnchorElement[];

  /** Answer every outstanding request; the carousel asks on creation. */
  async function settle(): Promise<void> {
    for (let pass = 0; pass < 6; pass++) {
      await fixture.whenStable();
      const open = http.match(() => true);
      if (open.length === 0) break;
      for (const request of open) {
        request.flush({
          data: [
            {
              _id: KITTEN_ID,
              nameUa: 'Мурчик',
              nameEn: 'Murchyk',
              breed: 'Регдол',
              color: 'блакитний',
              sex: 'male',
              status: 'available',
              birthDay: '2026-06-11T00:00:00.000Z',
              images: [{ full: 'https://images.example.com/a.jpg', isMain: true }],
              parentId: { mom: null, dad: null },
            },
          ],
          pagination: {
            page: 1,
            perPage: 10,
            totalItems: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        });
      }
    }
    await fixture.whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideLocationMocks(),
      ],
    });
    router = TestBed.inject(Router);
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(I18nService).setLanguage('uk');
    fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    await router.navigateByUrl('/uk');
    await settle();
  });

  it('points every kitten link at the catalogue', async () => {
    expect(kittenCards().length).toBeGreaterThan(0);
    for (const card of kittenCards()) {
      expect(card.getAttribute('href')).toBe('/uk/kittens');
    }
  });

  it('sends every button to a page rather than to a section of this one', async () => {
    const targets = buttons().map((b) => b.getAttribute('href'));

    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      // An in-page jump leaves visitors on the home page; these buttons are
      // meant to take them to the page they name.
      expect(target).not.toMatch(/^#/);
    }
    expect(targets).toContain('/uk/kittens');
    expect(targets).toContain('/uk/about');
  });

  it('opens the catalogue when a card is clicked', async () => {
    kittenCards()[0].click();
    await settle();

    expect(router.url).toBe('/uk/kittens');
  });
});
