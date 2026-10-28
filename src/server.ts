import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import type { IncomingMessage } from 'node:http';
import { join } from 'node:path';
import { SITE } from './app/services/site-config';
import { LANGUAGES, LANGUAGE_COOKIE, type Language } from './app/services/i18n.service';
import { API_PATH } from './app/services/api';
import { API_BACKEND_ORIGIN } from './api-backend';

const browserDistFolder = join(import.meta.dirname, '../browser');

/**
 * The production domain, shared with `SeoService` so canonical URLs, robots.txt
 * and the sitemap never disagree. `SITE_ORIGIN` overrides it for a staging
 * environment that should advertise itself instead.
 */
const SITE_ORIGIN = (process.env['SITE_ORIGIN'] || SITE.canonicalOrigin).replace(/\/+$/, '');

const canonicalHost = URL.canParse(SITE_ORIGIN) ? new URL(SITE_ORIGIN).host : '';

const API_BASE = `${API_BACKEND_ORIGIN}${API_PATH}`;

/** Routes that always belong in the sitemap. */
const STATIC_PATHS = ['/', '/kittens', '/parents', '/about', '/contacts'];

const SITEMAP_TTL_MS = 10 * 60 * 1000;
let sitemapCache: { xml: string; expiresAt: number } | null = null;

function firstHeaderValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : (value ?? '')).split(',')[0].trim();
}

function originFor(request: IncomingMessage): string {
  if (SITE_ORIGIN) {
    return SITE_ORIGIN;
  }

  const proto = firstHeaderValue(request.headers['x-forwarded-proto']) || 'https';
  const host =
    firstHeaderValue(request.headers['x-forwarded-host']) || firstHeaderValue(request.headers.host);

  return host ? `${proto}://${host}` : '';
}

/** CIS countries and their languages are served Ukrainian; everyone else English. */
const UKRAINIAN_REGIONS = /^(UA|RU|BY|KZ|KG|UZ|TJ|TM|AM|AZ|MD|GE)$/i;
const UKRAINIAN_LANGUAGES = /^(uk|ru|be|kk|ky|uz|tg|tk|hy|az|ka)$/i;

/**
 * An earlier explicit choice wins over the browser's locales — someone who
 * switched to English should not be bounced back to Ukrainian on their next
 * visit — and `?lang=` wins over both so a link can pin a language.
 */
function preferredLanguage(request: IncomingMessage): Language {
  const query = new URL(request.url ?? '/', 'http://localhost').searchParams.get('lang');
  if (query === 'uk' || query === 'en') {
    return query;
  }

  const cookie = request.headers.cookie
    ?.split(';')
    .map((part) => part.trim().split('='))
    .find(([name]) => name === LANGUAGE_COOKIE)?.[1];
  if (cookie === 'uk' || cookie === 'en') {
    return cookie;
  }

  for (const tag of acceptedLocales(request.headers['accept-language'])) {
    const [language, ...subtags] = tag.split('-');
    const region = subtags.find((subtag) => subtag.length === 2);

    if ((region && UKRAINIAN_REGIONS.test(region)) || UKRAINIAN_LANGUAGES.test(language)) {
      return 'uk';
    }

    if (language.toLowerCase() === 'en' || region) {
      return 'en';
    }
  }

  return 'en';
}

/** Locale tags from `Accept-Language`, best match first. */
function acceptedLocales(header: string | string[] | undefined): string[] {
  const raw = Array.isArray(header) ? header.join(',') : (header ?? '');

  return raw
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const quality = params.map((param) => /^\s*q=([\d.]+)\s*$/.exec(param)).find(Boolean);
      return { tag: tag.trim(), quality: quality ? Number(quality[1]) : 1 };
    })
    .filter((entry) => entry.tag && entry.tag !== '*' && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality)
    .map((entry) => entry.tag);
}

async function idsFrom(path: string): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/${path}?perPage=1000`);
    if (!response.ok) {
      return [];
    }

    const body = (await response.json()) as { data?: { _id?: string }[] };
    return (body.data ?? []).map((item) => item._id).filter((id): id is string => Boolean(id));
  } catch {
    // A sitemap listing only the static pages beats returning a 500.
    return [];
  }
}

/**
 * One `<url>` per language, each listing both languages as alternates. Google
 * requires an hreflang set to be complete and self-referencing, so every entry
 * points at itself as well as at its counterpart, plus the prefix-less URL as
 * `x-default`.
 */
function urlEntries(origin: string, path: string, priority: string): string[] {
  const clean = path === '/' ? '' : path.replace(/^\/+/, '');
  const href = (language: Language) => `${origin}/${language}${clean ? `/${clean}` : ''}`;
  const alternates = LANGUAGES.map(
    (language) =>
      `    <xhtml:link rel="alternate" hreflang="${language}" href="${href(language)}"/>`,
  );

  return LANGUAGES.map((language) =>
    [
      '  <url>',
      `    <loc>${href(language)}</loc>`,
      ...alternates,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}${path}"/>`,
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].join('\n'),
  );
}

async function buildSitemap(origin: string): Promise<string> {
  const [kittenIds, parentIds] = await Promise.all([
    idsFrom('cats/kittens'),
    idsFrom('cats/parents'),
  ]);

  const entries = [
    ...STATIC_PATHS.flatMap((path) => urlEntries(origin, path, path === '/' ? '1.0' : '0.8')),
    ...kittenIds.flatMap((id) => urlEntries(origin, `/kittens/${id}`, '0.7')),
    ...parentIds.flatMap((id) => urlEntries(origin, `/parents/${id}`, '0.6')),
  ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' +
      ' xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
}

const app = express();
/**
 * The app runs behind a reverse proxy (Vercel), which always forwards the
 * original request through `X-Forwarded-*` headers. Any `X-Forwarded-*` header
 * that is not explicitly trusted makes the engine fall back to client-side
 * rendering, so the ones the proxy sends are listed here.
 */
const angularApp = new AngularNodeAppEngine({
  trustProxyHeaders: [
    'x-forwarded-host',
    'x-forwarded-proto',
    'x-forwarded-port',
    'x-forwarded-for',
  ],
});

/**
 * The app asks its own origin for data, so `/api` has to lead somewhere. On
 * Vercel the `rewrites` entry answers these URLs at the edge and this handler
 * never runs; it is what makes the same paths work under `npm run
 * serve:ssr:Arlen-Fluffy-Plush` and on any other host.
 *
 * Only GET and HEAD are forwarded: the site reads the catalogue and nothing
 * else, so an open proxy for writes would be a liability rather than a feature.
 */
app.use(`${API_PATH}/{*splat}`, (req, res) => {
  // Falling through would send the request to the language redirect below and
  // answer a write with a 302 to `/uk/api/...`, which hides the real reason.
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).type('application/json').send({ message: 'Only GET is proxied.' });
    return;
  }

  const target = `${API_BACKEND_ORIGIN}${req.originalUrl}`;

  fetch(target, { headers: { accept: req.headers.accept ?? 'application/json' } })
    .then(async (response) => {
      res.status(response.status);
      const type = response.headers.get('content-type');
      if (type) {
        res.type(type);
      }

      res.send(Buffer.from(await response.arrayBuffer()));
    })
    .catch(() => {
      res.status(502).type('application/json').send({ message: 'Upstream API unavailable.' });
    });
});

/**
 * Collapse `www.` onto the canonical host so the two never compete in the
 * index. Other hosts are left alone: preview deployments stay reachable and
 * are kept out of the index by a `noindex` tag instead.
 */
app.use((req, res, next) => {
  const host =
    firstHeaderValue(req.headers['x-forwarded-host']) || firstHeaderValue(req.headers.host);

  if (host && host === `www.${canonicalHost}`) {
    res.redirect(301, `${SITE_ORIGIN}${req.originalUrl}`);
    return;
  }

  next();
});

/**
 * `robots.txt` and `sitemap.xml` are generated rather than shipped as files so
 * the absolute URLs inside them match the host actually serving the site.
 */
app.get('/robots.txt', (req, res) => {
  const origin = originFor(req);
  const lines = ['User-agent: *', 'Allow: /'];
  if (origin) {
    lines.push(`Sitemap: ${origin}/sitemap.xml`);
  }

  res.type('text/plain').send(lines.join('\n') + '\n');
});

app.get('/sitemap.xml', async (req, res, next) => {
  try {
    const origin = originFor(req);
    if (!origin) {
      res.status(503).type('text/plain').send('Sitemap unavailable: unknown host.\n');
      return;
    }

    const now = Date.now();
    if (!sitemapCache || sitemapCache.expiresAt < now) {
      sitemapCache = { xml: await buildSitemap(origin), expiresAt: now + SITEMAP_TTL_MS };
    }

    res.type('application/xml').send(sitemapCache.xml);
  } catch (error) {
    next(error);
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Every page lives under a language prefix, so a URL without one is not a page
 * but a request to be sent to the right language. Answering with a real 302 —
 * before Angular renders anything — is what lets `x-default` point at these
 * URLs: a crawler following `/kittens` lands on the version for its own
 * `Accept-Language`, and visitors keep whatever language they last chose.
 */
app.use((req, res, next) => {
  const path = req.path;
  const [first] = path.replace(/^\/+/, '').split('/');

  if ((LANGUAGES as readonly string[]).includes(first)) {
    next();
    return;
  }

  // Anything that looks like a file is not a page; let the 404 happen normally.
  if (first.includes('.')) {
    next();
    return;
  }

  const target = `/${preferredLanguage(req)}${path === '/' ? '' : path}`;

  // `lang` has done its job once it has chosen the prefix; carrying it along
  // would leave a second URL for the same page.
  const query = new URLSearchParams(req.originalUrl.slice(req.path.length).replace(/^\?/, ''));
  query.delete('lang');
  const search = query.size > 0 ? `?${query}` : '';

  res.setHeader('Vary', 'Accept-Language, Cookie');
  res.redirect(302, target + search);
});

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  // Two visitors can get different languages at the same URL only through the
  // redirect above; past that point the prefix decides. Caches still need to
  // know the redirect varies.
  res.setHeader('Vary', 'Accept-Language, Cookie');

  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
