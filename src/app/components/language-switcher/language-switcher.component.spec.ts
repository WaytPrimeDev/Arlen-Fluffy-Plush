import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { LanguageSwitcherComponent } from './language-switcher.component';

describe('LanguageSwitcherComponent', () => {
  let fixture: ComponentFixture<LanguageSwitcherComponent>;
  let router: Router;
  let i18n: I18nService;
  let navigated: string[];

  function click(label: 'EN' | 'UK'): void {
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const button = buttons.find((candidate) => candidate.textContent?.trim() === label);
    if (!button) {
      throw new Error(`no ${label} button`);
    }
    button.click();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    router = TestBed.inject(Router);
    i18n = TestBed.inject(I18nService);
    navigated = [];

    // Empty route config, so record the target instead of letting it navigate.
    vi.spyOn(router, 'navigateByUrl').mockImplementation((url) => {
      navigated.push(String(url));
      return Promise.resolve(true);
    });

    fixture = TestBed.createComponent(LanguageSwitcherComponent);
    await fixture.whenStable();
  });

  it('moves to the same page under the other prefix', async () => {
    vi.spyOn(router, 'url', 'get').mockReturnValue('/uk/kittens');
    i18n.setLanguage('uk');

    click('EN');

    expect(navigated).toEqual(['/en/kittens']);
    expect(i18n.getLanguage()).toBe('en');
  });

  it('keeps a deep path and its id', () => {
    vi.spyOn(router, 'url', 'get').mockReturnValue('/en/kittens/abc123');
    i18n.setLanguage('en');

    click('UK');

    expect(navigated).toEqual(['/uk/kittens/abc123']);
  });

  it('preserves the query string', () => {
    vi.spyOn(router, 'url', 'get').mockReturnValue('/uk/kittens?tab=parents&page=2');
    i18n.setLanguage('uk');

    click('EN');

    expect(navigated).toEqual(['/en/kittens?tab=parents&page=2']);
  });

  it('maps a language root onto the other language root', () => {
    vi.spyOn(router, 'url', 'get').mockReturnValue('/uk');
    i18n.setLanguage('uk');

    click('EN');

    expect(navigated).toEqual(['/en']);
  });

  it('adds a prefix to a URL that somehow has none', () => {
    vi.spyOn(router, 'url', 'get').mockReturnValue('/kittens');
    i18n.setLanguage('uk');

    click('EN');

    expect(navigated).toEqual(['/en/kittens']);
  });

  it('marks the active language on the button', async () => {
    i18n.setLanguage('uk');
    await fixture.whenStable();

    const active = (fixture.nativeElement as HTMLElement).querySelector('button.active');
    expect(active?.textContent?.trim()).toBe('UK');
  });
});
