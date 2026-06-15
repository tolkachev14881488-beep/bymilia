import { SITE } from './config.js';
import { getSiteRoot } from './site-path.js';

const DEFAULT_ORIGIN = 'https://by-milia.by';

/** Базовый URL для canonical, OG и JSON-LD */
export function getSiteOrigin() {
  if (typeof window !== 'undefined') {
    try {
      const root = getSiteRoot();
      const u = new URL(root);
      return (u.origin + u.pathname).replace(/\/$/, '');
    } catch {
      /* fallback */
    }
  }
  return DEFAULT_ORIGIN;
}

export const SITE_ORIGIN = DEFAULT_ORIGIN;

export function pageUrl(path = '') {
  const clean = path.replace(/^\//, '');
  const origin = typeof window !== 'undefined' ? getSiteOrigin() : DEFAULT_ORIGIN;
  return clean ? `${origin}/${clean}` : `${origin}/`;
}

/** Устанавливает title, description, canonical, Open Graph */
export function applySeo({ title, description, path = '', image, type = 'website', noindex = false }) {
  if (title) document.title = title;
  setMeta('description', description);
  setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');

  const canonical = pageUrl(path);
  setLink('canonical', canonical);

  setMetaProperty('og:type', type);
  setMetaProperty('og:site_name', SITE.brand);
  setMetaProperty('og:title', title || SITE.brand);
  setMetaProperty('og:description', description || '');
  setMetaProperty('og:url', canonical);
  setMetaProperty('og:locale', 'ru_BY');
  if (image) setMetaProperty('og:image', image.startsWith('http') ? image : pageUrl(image));

  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', title || SITE.brand);
  setMeta('twitter:description', description || '');
}

export function injectJsonLd(data) {
  const old = document.querySelector('script[data-seo-ld]');
  old?.remove();
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.dataset.seoLd = '1';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function breadcrumbJsonLd(items) {
  injectJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: pageUrl(item.path),
    })),
  });
}

function setMeta(name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function setMetaProperty(prop, content) {
  if (!content) return;
  let el = document.querySelector(`meta[property="${prop}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', prop);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}
