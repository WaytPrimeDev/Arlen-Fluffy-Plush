import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterLink, provideRouter } from '@angular/router';
import { I18nService } from '../services/i18n.service';
import { LocalizedPathPipe } from './localized-path.pipe';

/**
 * Asserts on the rendered `href`, which is what a visitor and a crawler
 * actually follow, rather than on the pipe's return value.
 */
@Component({
  imports: [RouterLink, LocalizedPathPipe],
  template: `
    <a id="root" [routerLink]="'/' | locPath">home</a>
    <a id="list" [routerLink]="'/kittens' | locPath">kittens</a>
    <a id="about" [routerLink]="'/about' | locPath">about</a>
    <a id="detail" [routerLink]="['/kittens', id] | locPath">kitten</a>
    <a id="parent" [routerLink]="['/parents', id] | locPath">parent</a>
    <a id="nested" [routerLink]="'/kittens/featured' | locPath">nested</a>
  `,
})
class LinkHost {
  id = 'abc123';
}

describe('LocalizedPathPipe', () => {
  let fixture: ComponentFixture<LinkHost>;
  let i18n: I18nService;

  function href(id: string): string | null {
    return (fixture.nativeElement as HTMLElement)
      .querySelector(`#${id}`)
      ?.getAttribute('href') ?? null;
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    i18n = TestBed.inject(I18nService);
    i18n.setLanguage('uk');
    fixture = TestBed.createComponent(LinkHost);
    await fixture.whenStable();
  });

  it('prefixes every link with the active language', () => {
    expect(href('root')).toBe('/uk');
    expect(href('list')).toBe('/uk/kittens');
    expect(href('about')).toBe('/uk/about');
  });

  it('keeps the dynamic segment of a link array', () => {
    expect(href('detail')).toBe('/uk/kittens/abc123');
    expect(href('parent')).toBe('/uk/parents/abc123');
  });

  it('handles a multi-segment path', () => {
    expect(href('nested')).toBe('/uk/kittens/featured');
  });

  it('rewrites the links in place when the language changes', async () => {
    i18n.setLanguage('en');
    await fixture.whenStable();

    // The header and footer survive a language change without being rebuilt,
    // so their links have to be recomputed — hence the impure pipe.
    expect(href('root')).toBe('/en');
    expect(href('list')).toBe('/en/kittens');
    expect(href('detail')).toBe('/en/kittens/abc123');
  });

  it('never leaves a link without a prefix', async () => {
    for (const language of ['uk', 'en'] as const) {
      i18n.setLanguage(language);
      await fixture.whenStable();

      for (const id of ['root', 'list', 'about', 'detail', 'parent', 'nested']) {
        expect(href(id)).toMatch(new RegExp(`^/${language}(/|$)`));
      }
    }
  });
});
