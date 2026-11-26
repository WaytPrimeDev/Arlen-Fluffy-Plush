import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import type { KittenApiItem } from '../kittens/kittens.service';
import { KittenComponent } from './kitten.component';

const CLOUDINARY = 'https://res.cloudinary.com/demo/image/upload';

const VIDEO_ID = 'dQw4w9WgXcQ';

function kittenWith(imageCount: number, videoId?: string | null): KittenApiItem {
  return {
    _id: 'kitten-1',
    videoId: videoId ?? null,
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
  const videoSlides = () => slides().filter((slide) => slide.hasAttribute('data-pswp-video-embed'));

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

  async function load(imageCount: number, videoId?: string | null): Promise<void> {
    await fixture.whenStable();
    http
      .expectOne((candidate) => candidate.url.includes('/cats/kitten/'))
      .flush({ data: kittenWith(imageCount, videoId), message: 'ok' });
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

  it('adds no slide when the kitten has no video', async () => {
    await load(3);

    expect(videoSlides().length).toBe(0);
    expect(slides().length).toBe(3);
  });

  it('puts the video second, after the main photo', async () => {
    await load(3, VIDEO_ID);

    // The main photo is what every card links to and what the page is
    // recognised by, so it keeps the opening slot and the video follows it.
    const kinds = slides().map((slide) =>
      slide.hasAttribute('data-pswp-video-embed') ? 'video' : 'photo',
    );
    expect(kinds).toEqual(['photo', 'video', 'photo', 'photo']);
  });

  it('leaves the video last for a kitten with a single photo', async () => {
    await load(1, VIDEO_ID);

    const kinds = slides().map((slide) =>
      slide.hasAttribute('data-pswp-video-embed') ? 'video' : 'photo',
    );
    expect(kinds).toEqual(['photo', 'video']);
    // Two slides now, so the strip that a lone photo hides comes back.
    expect(thumbs().length).toBe(2);
  });

  it('keeps the placeholder first and the video second when there are no photos', async () => {
    await load(0, VIDEO_ID);

    // The placeholder is not a button: there is nothing to open full screen,
    // and a placeholder inside the lightbox would be a dead end.
    const placeholder = host().querySelector('img.kitten-page__slide');
    expect(placeholder).not.toBeNull();
    expect(videoSlides().length).toBe(1);
    expect(slides().length).toBe(1);

    const stageChildren = Array.from(host().querySelector('.kitten-page__stage')!.children);
    expect(stageChildren.indexOf(placeholder!)).toBe(0);
    expect(stageChildren.indexOf(videoSlides()[0])).toBe(1);
  });

  it('loads no player until the video is opened', async () => {
    await load(2, VIDEO_ID);

    // The whole point of the poster: a kitten page that nobody watches the
    // video on must cost no YouTube request and set no YouTube identifiers.
    expect(host().querySelectorAll('iframe').length).toBe(0);
    const poster = videoSlides()[0].querySelector('img');
    expect(poster!.getAttribute('src')).toBe(`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`);
  });

  it('hands the viewer a cookie-free player URL and the shape to size it', async () => {
    await load(2, VIDEO_ID);

    const video = videoSlides()[0];
    const embed = video.getAttribute('data-pswp-video-embed')!;
    expect(embed.startsWith(`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?`)).toBe(true);
    // An iframe has no intrinsic size and its contents are cross-origin, so
    // the proportions have to be declared or the player is stretched.
    expect(video.getAttribute('data-pswp-width')).toBe('1280');
    expect(video.getAttribute('data-pswp-height')).toBe('720');
  });

  it('numbers the lightbox over the slides it actually holds', async () => {
    await load(0, VIDEO_ID);

    // The placeholder takes a slot on the stage but never opens, so counting
    // it would promise the viewer a slide it does not contain.
    expect(videoSlides()[0].getAttribute('aria-label')).toBe(
      TestBed.inject(I18nService).t('videoPlay', { label: 'Мурчик' }),
    );
    const photoLabels = slides()
      .filter((slide) => !slide.hasAttribute('data-pswp-video-embed'))
      .map((slide) => slide.getAttribute('aria-label'));
    expect(photoLabels).toEqual([]);
  });

  it('names the video for assistive tech and marks its thumbnail by shape', async () => {
    await load(2, VIDEO_ID);
    const i18n = TestBed.inject(I18nService);

    expect(videoSlides()[0].getAttribute('aria-label')).toBe(
      i18n.t('videoPlay', { label: 'Мурчик' }),
    );

    const videoThumb = thumbs()[1];
    expect(videoThumb.getAttribute('aria-label')).toBe(i18n.t('viewerGoToVideo'));
    // Not a tint: a difference carried by colour alone is no difference for
    // everyone who cannot see it.
    expect(videoThumb.querySelector('.kitten-page__thumb-badge')).not.toBeNull();
    expect(thumbs()[0].querySelector('.kitten-page__thumb-badge')).toBeNull();
  });

  it('drops a video id the backend should never have stored', async () => {
    // The id is re-checked on the way out because this runs against whatever
    // the API answered with, including an older build that kept a full URL in
    // the field. A bad value has to lose the video, not produce a dead player.
    await load(2, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    expect(videoSlides().length).toBe(0);
    expect(slides().length).toBe(2);
  });

  it('switches to the video when its thumbnail is clicked', async () => {
    await load(3, VIDEO_ID);

    thumbs()[1].click();
    await fixture.whenStable();

    expect(activeSlides().length).toBe(1);
    expect(activeSlides()[0].hasAttribute('data-pswp-video-embed')).toBe(true);
    expect(thumbs()[1].getAttribute('aria-current')).toBe('true');
  });
});
