import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import type { KittenApiItem } from '../kittens/kittens.service';
import { KittenComponent } from './kitten.component';

const CLOUDINARY = 'https://res.cloudinary.com/demo/image/upload';

function kittenWith(imageCount: number): KittenApiItem {
  return {
    _id: 'kitten-1',
    nameUa: 'Мурчик',
    nameEn: 'Murchyk',
    breed: 'Британська',
    color: 'блакитний',
    sex: 'male',
    birthDay: '2026-06-11T00:00:00.000Z',
    images: Array.from({ length: imageCount }, (_, index) => ({
      // Shaped like the real API: square `c_fill` crops next to an uncropped original.
      full: `${CLOUDINARY}/v1/cats/kittens/${index}.jpg`,
      mobile: `${CLOUDINARY}/w_400,h_400,c_fill/v1/cats/kittens/${index}.jpg`,
      thumbnail: `${CLOUDINARY}/w_200,h_200,c_fill/v1/cats/kittens/${index}.jpg`,
      isMain: index === 0,
    })),
    parentId: { mom: null, dad: null },
  };
}

describe('KittenComponent gallery', () => {
  let fixture: ComponentFixture<KittenComponent>;
  let http: HttpTestingController;

  const host = () => fixture.nativeElement as HTMLElement;
  const slides = () =>
    Array.from(host().querySelectorAll('button.kitten-page__slide')) as HTMLButtonElement[];
  const sources = () => slides().map((s) => s.getAttribute('data-pswp-src'));
  const activeSlides = () => slides().filter((a) => a.classList.contains('kitten-page__slide--active'));
  const thumbs = () =>
    Array.from(host().querySelectorAll('button.kitten-page__thumb')) as HTMLButtonElement[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(I18nService).setLanguage('uk');
    fixture = TestBed.createComponent(KittenComponent);
  });

  afterEach(() => {
    http.verify();
  });

  async function load(imageCount: number): Promise<void> {
    await fixture.whenStable();
    http
      .expectOne((candidate) => candidate.url.includes('/cats/kitten/'))
      .flush({ data: kittenWith(imageCount), message: 'ok' });
    await fixture.whenStable();
  }

  it('renders one lightbox anchor per photo, with no duplicate of the active one', async () => {
    await load(3);

    // The lightbox collects these anchors, so an extra "main image" anchor
    // would show the selected photo twice.
    expect(slides().length).toBe(3);
    expect(sources()).toEqual([
      `${CLOUDINARY}/c_limit,w_1600,f_auto,q_auto/v1/cats/kittens/0.jpg`,
      `${CLOUDINARY}/c_limit,w_1600,f_auto,q_auto/v1/cats/kittens/1.jpg`,
      `${CLOUDINARY}/c_limit,w_1600,f_auto,q_auto/v1/cats/kittens/2.jpg`,
    ]);
  });

  it('shows exactly one slide and hides the rest from assistive tech', async () => {
    await load(3);

    expect(activeSlides().length).toBe(1);
    expect(activeSlides()[0].getAttribute('data-pswp-src')).toBe(
      `${CLOUDINARY}/c_limit,w_1600,f_auto,q_auto/v1/cats/kittens/0.jpg`,
    );

    const hidden = slides().filter((a) => !a.classList.contains('kitten-page__slide--active'));
    expect(hidden.map((a) => a.getAttribute('aria-hidden'))).toEqual(['true', 'true']);
    expect(hidden.map((a) => a.getAttribute('tabindex'))).toEqual(['-1', '-1']);
  });

  it('switches the visible slide when a thumbnail is clicked', async () => {
    await load(3);

    expect(thumbs().length).toBe(3);
    thumbs()[2].click();
    await fixture.whenStable();

    expect(activeSlides().length).toBe(1);
    expect(activeSlides()[0].getAttribute('data-pswp-src')).toBe(
      `${CLOUDINARY}/c_limit,w_1600,f_auto,q_auto/v1/cats/kittens/2.jpg`,
    );
    expect(thumbs()[2].getAttribute('aria-current')).toBe('true');
  });

  it('keeps thumbnails out of the lightbox so clicking one does not open it', async () => {
    await load(3);

    const stage = host().querySelector('.kitten-page__stage');
    expect(stage).not.toBeNull();
    expect(stage!.querySelector('.kitten-page__thumb')).toBeNull();
    // Thumbnails must not be anchors: PhotoSwipe binds its click handler on the
    // gallery root, so a nested <a> would open the viewer instead of switching.
    expect(host().querySelectorAll('a.kitten-page__thumb').length).toBe(0);
  });

  it('never shows a square crop where the photo keeps its own shape', async () => {
    await load(2);

    // PhotoSwipe stretches the on-page <img> over the slide while the large
    // version loads, so a `c_fill` crop here is visible as a distorted photo.
    const stageImages = Array.from(
      host().querySelectorAll('.kitten-page__slide img'),
    ) as HTMLImageElement[];
    expect(stageImages.length).toBe(2);
    for (const image of stageImages) {
      expect(image.getAttribute('src')).toContain('c_limit');
      expect(image.getAttribute('src')).not.toContain('c_fill');
    }
    for (const source of sources()) {
      expect(source).not.toContain('c_fill');
    }

    // The thumbnail strip is square by design, so there the crop is right.
    expect(thumbs()[0].querySelector('img')!.getAttribute('src')).toContain('c_fill');
  });

  it('carries no link, so an early click cannot leave the page', async () => {
    await load(3);

    // Before hydration an <a href> is a live destination: clicking the photo
    // would navigate away to the bare image file.
    expect(host().querySelectorAll('.kitten-page__slide[href]').length).toBe(0);
    for (const slide of slides()) {
      expect(slide.tagName).toBe('BUTTON');
      expect(slide.getAttribute('type')).toBe('button');
    }
  });

  it('hides the thumbnail strip for a single photo', async () => {
    await load(1);

    expect(slides().length).toBe(1);
    expect(thumbs().length).toBe(0);
  });
});
