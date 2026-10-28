import { DOCUMENT, Injectable, REQUEST, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { I18nService, LANGUAGES, localizedPath, type Language } from './i18n.service';
import { SEO_LOCALES, SITE } from './site-config';
import {
  BREEDS,
  DETAIL_COPY,
  KEYWORDS,
  ORGANIZATION_DESCRIPTION,
  seoCopy,
  type SeoPageKey,
} from './seo-content';
import type { KittenStatus } from './kitten-view.util';

export interface SeoBreadcrumb {
  label: string;
  path: string;
}

interface SeoInput {
  title: string;
  description: string;
  /** Absolute or root-relative; turned into an absolute URL. */
  image?: string | null;
  type?: 'website' | 'article' | 'profile';
  breadcrumbs?: SeoBreadcrumb[];
  /** False for a URL that should stay out of the index, such as a 404. */
  indexable?: boolean;
  /** Structured data describing the subject of a detail page. */
  about?: { name: string; description: string; image: string | null };
  /**
   * Turns a detail page into an offer a shopping query can match. Only a
   * kitten carries one; a parent is not for sale.
   */
  offer?: { status: KittenStatus; prices: readonly (string | null)[] };
}

/** schema.org availability for the three states a kitten can be in. */
const AVAILABILITY: Record<KittenStatus, string> = {
  available: 'https://schema.org/InStock',
  reserved: 'https://schema.org/PreOrder',
  offline: 'https://schema.org/SoldOut',
};

const CURRENCIES: [RegExp, string][] = [
  [/грн|₴|uah/i, 'UAH'],
  [/\$|usd|дол/i, 'USD'],
  [/€|eur|євро/i, 'EUR'],
];

/**
 * Prices are free text on the admin side ("1200 $", "від 15000 грн"), so an
 * `Offer` only claims a number when one can be read out of the string
 * unambiguously, together with a currency. Anything else is published as an
 * offer without a price rather than as a wrong one.
 */
function parsePrice(prices: readonly (string | null)[]): { price: number; currency: string } | null {
  for (const raw of prices) {
    if (!raw) {
      continue;
    }

    const currency = CURRENCIES.find(([pattern]) => pattern.test(raw))?.[1];
    const digits = raw.replace(/[\s\u00a0]/g, '').match(/\d+(?:[.,]\d{1,2})?/g);
    if (!currency || digits?.length !== 1) {
      continue;
    }

    const price = Number(digits[0].replace(',', '.'));
    if (Number.isFinite(price) && price > 0) {
      return { price, currency };
    }
  }

  return null;
}

const JSON_LD_ID = 'app-structured-data';

/**
 * Owns everything a crawler reads: title, snippet description, canonical URL,
 * social cards, `<html lang>` and JSON-LD. It runs during server-side rendering
 * too, so the markup is already correct in the very first response.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly i18n = inject(I18nService);
  private readonly request = inject(REQUEST, { optional: true });

  /** Applies the copy of a static page. */
  applyPage(key: SeoPageKey, path: string): void {
    const language = this.i18n.getLanguage();
    const copy = seoCopy(language, key);

    this.apply(path, {
      title: copy.title,
      description: copy.description,
      type: 'website',
      breadcrumbs: key === 'home' ? [] : [{ label: copy.breadcrumb, path }],
    });
  }

  applyKitten(details: {
    path: string;
    name: string;
    breed: string;
    color: string;
    age: string;
    image: string | null;
    status: KittenStatus;
    prices: readonly (string | null)[];
  }): void {
    const language = this.i18n.getLanguage();
    const copy = DETAIL_COPY[language];
    const description = copy.kittenDescription(
      details.name,
      details.breed,
      details.color,
      details.age,
    );

    this.apply(details.path, {
      title: copy.kittenTitle(details.name, details.breed),
      description,
      image: details.image,
      type: 'article',
      breadcrumbs: [
        { label: seoCopy(language, 'kittens').breadcrumb, path: '/kittens' },
        { label: details.name, path: details.path },
      ],
      about: { name: details.name, description, image: details.image },
      offer: { status: details.status, prices: details.prices },
    });
  }

  applyParent(details: {
    path: string;
    name: string;
    breed: string;
    color: string;
    image: string | null;
  }): void {
    const language = this.i18n.getLanguage();
    const copy = DETAIL_COPY[language];
    const description = copy.parentDescription(details.name, details.breed, details.color);

    this.apply(details.path, {
      title: copy.parentTitle(details.name, details.breed),
      description,
      image: details.image,
      type: 'profile',
      breadcrumbs: [
        { label: seoCopy(language, 'parents').breadcrumb, path: '/parents' },
        { label: details.name, path: details.path },
      ],
      about: { name: details.name, description, image: details.image },
    });
  }

  /** Metadata for a URL that does not name a page. */
  applyNotFound(path: string): void {
    const language = this.i18n.getLanguage();

    this.apply(path, {
      title: this.i18n.t('notFoundTitle'),
      description: this.i18n.t('notFoundText'),
      type: 'website',
      indexable: false,
      breadcrumbs: [{ label: seoCopy(language, 'home').breadcrumb, path: '/' }],
    });
  }

  private apply(path: string, input: SeoInput): void {
    const language = this.i18n.getLanguage();
    const locale = SEO_LOCALES[language];
    const fullTitle = `${input.title} | ${SITE.name}`;
    // `path` arrives without a language prefix; the canonical URL carries one.
    const canonical = this.absoluteUrl(localizedPath(language, path));
    const image = this.absoluteUrl(input.image ?? SITE.socialImagePath);

    this.document.documentElement.lang = locale.htmlLang;
    this.title.setTitle(fullTitle);

    this.setMetaByName('description', input.description);
    this.setMetaByName('keywords', KEYWORDS[language].join(', '));
    this.setMetaByName('robots', this.robotsDirective(input.indexable !== false));

    this.setMetaByProperty('og:type', input.type ?? 'website');
    this.setMetaByProperty('og:site_name', SITE.name);
    this.setMetaByProperty('og:title', fullTitle);
    this.setMetaByProperty('og:description', input.description);
    this.setMetaByProperty('og:url', canonical);
    this.setMetaByProperty('og:locale', locale.ogLocale);
    this.setMetaByProperty('og:image', image);

    this.setMetaByName('twitter:card', image ? 'summary_large_image' : 'summary');
    this.setMetaByName('twitter:title', fullTitle);
    this.setMetaByName('twitter:description', input.description);
    this.setMetaByName('twitter:image', image);

    if (input.indexable === false) {
      // A URL that is not a page has no canonical form and no translations;
      // advertising either would invite Google to index it anyway.
      this.removeCanonical();
      this.removeAlternates();
    } else {
      this.setCanonical(canonical);
      this.setAlternates(path);
    }

    this.setStructuredData(language, canonical, input);
  }

  private robotsDirective(indexable: boolean): string {
    if (!indexable) {
      return 'noindex, follow';
    }

    return this.isCanonicalHost() ? 'index, follow, max-image-preview:large' : 'noindex, nofollow';
  }

  private setStructuredData(language: Language, canonical: string, input: SeoInput): void {
    const origin = this.origin();
    const graph: Record<string, unknown>[] = [
      {
        // Also a LocalBusiness: the cattery sells kittens from one city, and
        // that is the type local and shopping surfaces understand.
        '@type': ['Organization', 'LocalBusiness'],
        '@id': `${origin}/#organization`,
        name: SITE.name,
        alternateName: [...SITE.alternateNames],
        description: ORGANIZATION_DESCRIPTION[language],
        url: origin || undefined,
        logo: this.absoluteUrl(SITE.logoPath) || undefined,
        image: this.absoluteUrl(SITE.logoPath) || undefined,
        // Every other place the same cattery publishes, the former Jimdo site
        // included, so a search for any of those names resolves to this one.
        sameAs: [...SITE.profiles],
        knowsAbout: [...BREEDS[language]],
        areaServed: { '@type': 'Country', name: SITE.countryCode },
        ...(SITE.email ? { email: SITE.email } : {}),
        ...(SITE.telephone ? { telephone: SITE.telephone } : {}),
        address: {
          '@type': 'PostalAddress',
          addressLocality: SITE.locality[language],
          addressCountry: SITE.countryCode,
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        name: SITE.name,
        alternateName: [...SITE.alternateNames],
        url: origin || undefined,
        inLanguage: SEO_LOCALES[language].htmlLang,
        publisher: { '@id': `${origin}/#organization` },
      },
      {
        '@type': input.about ? 'ItemPage' : 'WebPage',
        url: canonical || undefined,
        name: input.title,
        description: input.description,
        inLanguage: SEO_LOCALES[language].htmlLang,
        isPartOf: { '@id': `${origin}/#website` },
        ...(input.about
          ? {
              about: {
                '@type': 'Thing',
                name: input.about.name,
                description: input.about.description,
                ...(input.about.image ? { image: input.about.image } : {}),
              },
            }
          : {}),
      },
    ];

    if (input.about && input.offer) {
      const parsed = parsePrice(input.offer.prices);
      graph.push({
        '@type': 'Product',
        name: input.about.name,
        description: input.about.description,
        ...(input.about.image ? { image: input.about.image } : {}),
        brand: { '@id': `${origin}/#organization` },
        category: seoCopy(language, 'kittens').breadcrumb,
        offers: {
          '@type': 'Offer',
          url: canonical || undefined,
          availability: AVAILABILITY[input.offer.status],
          seller: { '@id': `${origin}/#organization` },
          ...(parsed ? { price: parsed.price, priceCurrency: parsed.currency } : {}),
        },
      });
    }

    const breadcrumbs = input.breadcrumbs ?? [];
    if (breadcrumbs.length > 0) {
      const home = seoCopy(language, 'home').breadcrumb;
      graph.push({
        '@type': 'BreadcrumbList',
        itemListElement: [{ label: home, path: '/' }, ...breadcrumbs].map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.label,
          item: this.absoluteUrl(localizedPath(language, crumb.path)) || undefined,
        })),
      });
    }

    this.writeJsonLd({ '@context': 'https://schema.org', '@graph': graph });
  }

  private writeJsonLd(data: unknown): void {
    const existing = this.document.getElementById(JSON_LD_ID);
    const script = existing ?? this.document.createElement('script');

    script.id = JSON_LD_ID;
    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify(data);

    if (!existing) {
      this.document.head.appendChild(script);
    }
  }

  /**
   * Declares the two language versions to each other, plus `x-default` for the
   * prefix-less URL, which redirects by `Accept-Language`. Without these,
   * Google treats `/uk/kittens` and `/en/kittens` as unrelated duplicates.
   */
  private setAlternates(path: string): void {
    const head = this.document.head;
    this.removeAlternates();

    const alternates: [string, string][] = [
      ...LANGUAGES.map((language) => [language, localizedPath(language, path)] as [string, string]),
      ['x-default', path],
    ];

    for (const [hreflang, target] of alternates) {
      const href = this.absoluteUrl(target);
      if (!href) {
        continue;
      }

      const link = this.document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', hreflang);
      link.setAttribute('href', href);
      head.appendChild(link);
    }
  }

  private removeAlternates(): void {
    for (const link of Array.from(this.document.head.querySelectorAll('link[rel="alternate"]'))) {
      link.remove();
    }
  }

  private removeCanonical(): void {
    this.document.head.querySelector('link[rel="canonical"]')?.remove();
  }

  private setCanonical(href: string): void {
    if (!href) {
      return;
    }

    const existing = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const link = existing ?? this.document.createElement('link');

    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', href);

    if (!existing) {
      this.document.head.appendChild(link);
    }
  }

  private setMetaByName(name: string, content: string): void {
    if (content) {
      this.meta.updateTag({ name, content });
    } else {
      this.meta.removeTag(`name="${name}"`);
    }
  }

  private setMetaByProperty(property: string, content: string): void {
    if (content) {
      this.meta.updateTag({ property, content }, `property="${property}"`);
    } else {
      this.meta.removeTag(`property="${property}"`);
    }
  }

  /** Turns a root-relative path into an absolute URL; '' when the origin is unknown. */
  private absoluteUrl(pathOrUrl: string | null | undefined): string {
    if (!pathOrUrl) {
      return '';
    }

    if (/^https?:\/\//i.test(pathOrUrl)) {
      return pathOrUrl;
    }

    const origin = this.origin();
    return origin ? new URL(pathOrUrl, origin).toString() : '';
  }

  /** The origin every indexable URL is built from. */
  private origin(): string {
    return SITE.canonicalOrigin || this.servingOrigin();
  }

  private servingOrigin(): string {
    const href = this.request?.url ?? (typeof location === 'undefined' ? null : location.href);
    return href && URL.canParse(href) ? new URL(href).origin : '';
  }

  /**
   * False on a preview deployment or any other host that is not the canonical
   * one, which is reason enough to keep that copy out of the index.
   */
  private isCanonicalHost(): boolean {
    const serving = this.servingOrigin();
    return !serving || !SITE.canonicalOrigin || serving === SITE.canonicalOrigin;
  }
}
