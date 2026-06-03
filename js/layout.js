import { SITE, CONTACTS } from './config.js';
import { getSiteRoot } from './site-path.js';
import { cartCount } from './cart.js';
import { telUrl, mailUrl, waUrl } from './manager.js';

const NAV = [
  { href: '/catalog.html', label: 'Каталог' },
  { href: '/pages/wholesale.html', label: 'Опт' },
  { href: '/pages/production.html', label: 'Производство' },
  { href: '/pages/delivery.html', label: 'Доставка' },
  { href: '/pages/faq.html', label: 'Вопросы' },
  { href: '/pages/contacts.html', label: 'Контакты' },
];

function inPagesDir() {
  return window.location.pathname.replace(/\\/g, '/').includes('/pages/');
}

export function asset(path) {
  return inPagesDir() ? `../${path}` : path;
}

/** Абсолютный URL ассета (корректно на GitHub Pages /bymilia/) */
export function assetUrl(path) {
  if (!path || path.startsWith('http')) return path;
  const clean = path.replace(/^\.\//, '');
  const rel = inPagesDir() ? `../${clean}` : clean;
  try {
    return new URL(rel, getSiteRoot()).href;
  } catch {
    return rel;
  }
}

export function pageHref(href) {
  if (href.startsWith('http') || href.startsWith('#')) return href;
  const clean = href.replace(/^\//, '');
  return inPagesDir() ? `../${clean}` : clean;
}

function getMapCoords() {
  const lat = Number(CONTACTS.mapLat) || 53.882715;
  const lon = Number(CONTACTS.mapLon) || 27.424353;
  return { lat, lon };
}

export function googleMapsRouteUrl() {
  const { lat, lon } = getMapCoords();
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

export function yandexMapsRouteUrl() {
  const { lat, lon } = getMapCoords();
  return `https://yandex.by/maps/?rtext=~${lat},${lon}&rtt=auto`;
}

function mapEmbedUrl() {
  const { lat, lon } = getMapCoords();
  return `https://yandex.ru/map-widget/v1/?ll=${encodeURIComponent(`${lon},${lat}`)}&z=16&pt=${encodeURIComponent(`${lon},${lat},pm2rdm`)}&l=map`;
}

function renderFooterMap() {
  const { lat, lon } = getMapCoords();
  const googleRoute = googleMapsRouteUrl();
  const yandexRoute = yandexMapsRouteUrl();
  const yandexPoint = `https://yandex.by/maps/?pt=${lon},${lat}&z=17&l=map`;

  return `
      <div class="footer-map-block">
        <div class="footer-map-copy">
          <p class="footer-heading">Самовывоз</p>
          <p class="footer-map-address">${CONTACTS.address}</p>
          <p class="footer-map-hours">${CONTACTS.pickupHours || ''}</p>
          <div class="footer-map-links">
            <a class="footer-map-link" href="${googleRoute}" target="_blank" rel="noopener noreferrer" aria-label="Построить маршрут в Google Картах">Google Карты</a>
            <a class="footer-map-link" href="${yandexRoute}" target="_blank" rel="noopener noreferrer" aria-label="Построить маршрут в Яндекс Картах">Яндекс Карты</a>
          </div>
        </div>
        <div class="footer-map-wrap">
          <iframe
            class="footer-map-frame"
            title="Карта — ${CONTACTS.address}"
            src="${mapEmbedUrl()}"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
          ></iframe>
          <a class="footer-map-open" href="${yandexPoint}" target="_blank" rel="noopener noreferrer">Открыть на карте</a>
        </div>
      </div>`;
}

function renderHeader() {
  const count = cartCount();
  const home = pageHref('/index.html');
  const cart = pageHref('/cart.html');
  const logo = asset('assets/logo.png');

  return `
    <header class="site-header">
      <div class="container header-inner">
        <div class="header-brand">
          <a class="logo-link" href="${home}" aria-label="${SITE.brand} — на главную">
            <img src="${logo}" alt="${SITE.brand}" class="logo-img" width="160" height="48">
          </a>
          <p class="header-address">${CONTACTS.address}</p>
        </div>
        <button class="nav-toggle" type="button" aria-label="Меню" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <nav class="site-nav" aria-label="Основное меню">
          <ul>
            ${NAV.map((n) => `<li><a href="${pageHref(n.href)}">${n.label}</a></li>`).join('')}
          </ul>
          <div class="nav-mobile-contacts">
            <a class="nav-mobile-phone" href="${telUrl()}">${CONTACTS.phone}</a>
            <a class="nav-mobile-wa" href="${waUrl()}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <p class="nav-mobile-note">Приём заказов до 13:00 — отправка в тот же день</p>
          </div>
        </nav>
        <div class="header-actions">
          <div class="header-phone-block">
            <a class="header-phone" href="${telUrl()}">${CONTACTS.phone}</a>
            <span class="header-phone-note"><span class="header-phone-line">Приём заказов до 13:00 —</span><span class="header-phone-line">отправка в тот же день</span></span>
          </div>
          <a class="cart-link" href="${cart}" aria-label="Корзина">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M6 6L5 3H2"/>
            </svg>
            <span class="cart-badge" data-cart-badge ${count ? '' : 'hidden'}>${count || ''}</span>
          </a>
        </div>
      </div>
    </header>
  `;
}

function renderFooter() {
  const year = new Date().getFullYear();
  return `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <p class="footer-title">${SITE.brand}</p>
          <p class="footer-muted">${SITE.tagline}</p>
        </div>
        <div>
          <p class="footer-heading">Покупателям</p>
          <ul class="footer-links">
            <li><a href="${pageHref('/catalog.html')}">Каталог</a></li>
            <li><a href="${pageHref('/cart.html')}">Корзина</a></li>
            <li><a href="${pageHref('/pages/delivery.html')}">Доставка и оплата</a></li>
            <li><a href="${pageHref('/pages/guarantee.html')}">Гарантия и возврат</a></li>
            <li><a href="${pageHref('/pages/where-to-buy.html')}">Где купить</a></li>
          </ul>
        </div>
        <div>
          <p class="footer-heading">Компания</p>
          <ul class="footer-links">
            <li><a href="${pageHref('/pages/about.html')}">О нас</a></li>
            <li><a href="${pageHref('/pages/production.html')}">Производство</a></li>
            <li><a href="${pageHref('/pages/wholesale.html')}">Опт</a></li>
            <li><a href="${pageHref('/pages/news.html')}">Новости</a></li>
          </ul>
        </div>
        <div>
          <p class="footer-heading">Менеджер</p>
          <ul class="footer-links">
            <li><a href="${waUrl()}" target="_blank" rel="noopener noreferrer">WhatsApp — заказ и вопросы</a></li>
            <li><a href="${telUrl()}">${CONTACTS.phone}</a></li>
            <li><a href="${mailUrl()}">${CONTACTS.email}</a></li>
            <li>${CONTACTS.address}</li>
            <li>${CONTACTS.pickupHours || ''}</li>
          </ul>
        </div>
      </div>
      <div class="container">
        ${renderFooterMap()}
      </div>
      <div class="container footer-bottom">
        <p>© ${year} ${SITE.brand}</p>
        <p>
          <a href="${pageHref('/pages/offer.html')}">Оферта</a>
          ·
          <a href="${pageHref('/pages/privacy.html')}">Конфиденциальность</a>
          ·
          <a href="${pageHref('/admin/index.html')}">Админка</a>
        </p>
      </div>
    </footer>
  `;
}

export function initLayout() {
  const headerSlot = document.getElementById('site-header');
  const footerSlot = document.getElementById('site-footer');
  if (headerSlot) {
    headerSlot.hidden = false;
    headerSlot.innerHTML = renderHeader();
  }
  if (footerSlot) footerSlot.innerHTML = renderFooter();

  import('./motion.js')
    .then(({ initMotion }) => initMotion())
    .catch(() => {});

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');

  function setNavOpen(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-open', open);
  }

  toggle?.addEventListener('click', () => {
    setNavOpen(!nav.classList.contains('is-open'));
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setNavOpen(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setNavOpen(false);
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 901px)').matches) setNavOpen(false);
  });

  window.addEventListener('cart-updated', () => {
    const badge = document.querySelector('[data-cart-badge]');
    if (!badge) return;
    const n = cartCount();
    badge.textContent = n;
    badge.hidden = !n;
  });
}
