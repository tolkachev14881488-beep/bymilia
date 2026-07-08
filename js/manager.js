import { CONTACTS, SITE } from './config.js';
import { cartCount } from './cart.js';
import { pageHref } from './layout.js';
import { renderSizeChart } from './size-chart.js';

const DEFAULT_WA_TEXT = 'Здравствуйте! Хочу заказать сапожки By Milia. Подскажите, пожалуйста.';
const CONSULTANT_URL = 'https://consultant-dusky.vercel.app/';

export function waUrl(text = DEFAULT_WA_TEXT) {
  return `https://wa.me/${CONTACTS.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function viberUrl() {
  return `viber://chat?number=%2B${CONTACTS.phoneRaw}`;
}

export function telegramUrl() {
  return `https://t.me/+${CONTACTS.phoneRaw}`;
}

export function telUrl() {
  return `tel:${CONTACTS.phoneRaw}`;
}

export function mailUrl(subject = `Вопрос ${SITE.brand}`) {
  return `mailto:${CONTACTS.email}?subject=${encodeURIComponent(subject)}`;
}

export function renderMessengerLinks(waText = DEFAULT_WA_TEXT) {
  return `
    <div class="messenger-links" role="group" aria-label="Написать менеджеру">
      <a class="messenger-btn messenger-btn--viber" href="${viberUrl()}" target="_blank" rel="noopener noreferrer">
        <span class="messenger-btn-icon" aria-hidden="true">V</span>
        <span class="messenger-btn-label">Viber</span>
      </a>
      <a class="messenger-btn messenger-btn--wa" href="${waUrl(waText)}" target="_blank" rel="noopener noreferrer">
        <span class="messenger-btn-icon" aria-hidden="true">W</span>
        <span class="messenger-btn-label">WhatsApp</span>
      </a>
      <a class="messenger-btn messenger-btn--tg" href="${telegramUrl()}" target="_blank" rel="noopener noreferrer">
        <span class="messenger-btn-icon" aria-hidden="true">T</span>
        <span class="messenger-btn-label">Telegram</span>
      </a>
    </div>`;
}

/** Плавающая кнопка корзины */
export function renderFabCart() {
  if (/\/cart\.html$/i.test(window.location.pathname.replace(/\\/g, '/'))) return '';
  const count = cartCount();
  const cart = pageHref('/cart.html');
  return `
    <a class="fab-cart" href="${cart}" aria-label="${count ? `Корзина, ${count} товаров` : 'Корзина'}">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
        <path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M6 6L5 3H2"/>
      </svg>
      <span class="fab-cart-badge" data-fab-cart-badge ${count ? '' : 'hidden'}>${count || ''}</span>
    </a>
  `;
}

export function updateFabCart() {
  const fab = document.querySelector('.fab-cart');
  const badge = document.querySelector('[data-fab-cart-badge]');
  if (!fab) return;
  const n = cartCount();
  fab.setAttribute('aria-label', n ? `Корзина, ${n} товаров` : 'Корзина');
  if (badge) {
    badge.textContent = n;
    badge.hidden = !n;
  }
}

function renderConsultantWidget() {
  return `
    <button class="fab-consultant" type="button" aria-label="Открыть ИИ-консультанта" aria-expanded="false" aria-controls="consultant-modal">
      <span class="fab-consultant-icon" aria-hidden="true">AI</span>
      <span class="fab-consultant-label">ИИ-консультант</span>
    </button>
    <div class="consultant-modal" id="consultant-modal" hidden>
      <div class="consultant-modal__backdrop" data-consultant-close></div>
      <section class="consultant-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="consultant-modal-title">
        <header class="consultant-modal__header">
          <div>
            <p class="consultant-modal__eyebrow">By Milia</p>
            <h2 class="consultant-modal__title" id="consultant-modal-title">ИИ-консультант</h2>
          </div>
          <button class="consultant-modal__close" type="button" aria-label="Закрыть" data-consultant-close>×</button>
        </header>
        <div class="consultant-modal__body">
          <iframe
            class="consultant-modal__frame"
            src="${CONSULTANT_URL}"
            title="ИИ-консультант By Milia"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="clipboard-write"
          ></iframe>
        </div>
        <footer class="consultant-modal__footer">
          <a href="${CONSULTANT_URL}" target="_blank" rel="noopener noreferrer">Открыть в новой вкладке</a>
        </footer>
      </section>
    </div>
  `;
}

function initConsultantWidget() {
  const stack = document.getElementById('fab-stack');
  if (!stack || stack.querySelector('.fab-consultant')) return;
  stack.insertAdjacentHTML('afterbegin', renderConsultantWidget());

  const button = stack.querySelector('.fab-consultant');
  const modal = document.getElementById('consultant-modal');
  const closeNodes = modal?.querySelectorAll('[data-consultant-close]') ?? [];

  if (!button || !modal) return;

  const setOpen = (open) => {
    modal.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('consultant-open', open);
  };

  button.addEventListener('click', () => {
    setOpen(modal.hidden);
  });

  closeNodes.forEach((node) => {
    node.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) setOpen(false);
  });
}

/** Карточка «Связаться с менеджером» — одинаковая на всех страницах */
export function renderManagerCard(opts = {}) {
  const {
    title = 'Помочь с выбором расцветки и размера, вопросы по доставке?',
    text = 'Свяжитесь удобным для вас способом',
    waText = DEFAULT_WA_TEXT,
    compact = false,
    showSizeChart = false,
  } = opts;

  return `
    <aside class="manager-card${compact ? ' manager-card--compact' : ''}${showSizeChart ? ' manager-card--with-chart' : ''}" aria-label="Связь с менеджером">
      <p class="manager-card-eyebrow">Менеджер By Milia</p>
      <h2 class="manager-card-title">${title}</h2>
      ${showSizeChart ? renderSizeChart() : ''}
      <p class="manager-card-text">${text}</p>
      ${renderMessengerLinks(waText)}
      <p class="manager-card-phone"><a href="${telUrl()}">${CONTACTS.phone}</a></p>
      <ul class="manager-card-meta">
        <li><a href="${mailUrl()}">${CONTACTS.email}</a></li>
        <li>${CONTACTS.address}</li>
        <li>${CONTACTS.pickupHours || 'По предварительной договорённости'}</li>
      </ul>
      <p class="manager-card-note">Заказ на сайте → заявка менеджеру. Также <a href="${CONTACTS.wildberries}" target="_blank" rel="noopener">Wildberries</a>.</p>
    </aside>
  `;
}

export function mountGlobalContacts() {
  let stack = document.getElementById('fab-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'fab-stack';
    stack.className = 'fab-stack';
    document.body.appendChild(stack);
  }
  const fabHtml = renderFabCart();
  stack.innerHTML = fabHtml;
  document.body.classList.toggle('has-fab', Boolean(fabHtml.trim()));
  initConsultantWidget();

  if (!window.__fabCartListener) {
    window.__fabCartListener = true;
    window.addEventListener('cart-updated', updateFabCart);
  }
  updateFabCart();
}

export function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}
