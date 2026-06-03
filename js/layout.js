import { SITE, CONTACTS } from './config.js';
import { cartCount } from './cart.js';
import { waUrl, telUrl, mailUrl } from './manager.js';

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

export function pageHref(href) {
  if (href.startsWith('http') || href.startsWith('#')) return href;
  const clean = href.replace(/^\//, '');
  return inPagesDir() ? `../${clean}` : clean;
}

function renderHeader() {
  const count = cartCount();
  const home = pageHref('/index.html');
  const catalog = pageHref('/catalog.html');
  const cart = pageHref('/cart.html');
  const logo = asset('assets/logo.png');

  return `
    <header class="site-header">
      <div class="container header-inner">
        <a class="logo-link" href="${home}" aria-label="${SITE.brand} — на главную">
          <img src="${logo}" alt="${SITE.brand}" class="logo-img" width="160" height="48">
        </a>
        <button class="nav-toggle" type="button" aria-label="Меню" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <nav class="site-nav" aria-label="Основное меню">
          <ul>
            ${NAV.map((n) => `<li><a href="${pageHref(n.href)}">${n.label}</a></li>`).join('')}
          </ul>
        </nav>
        <div class="header-actions">
          <a class="btn btn-ghost btn-sm header-wa" href="${waUrl()}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a class="btn btn-primary btn-sm" href="${catalog}">Каталог</a>
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
