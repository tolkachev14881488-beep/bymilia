import { CONTACTS } from './config.js';
import { waUrl, telUrl } from './manager.js';
import { pageHref } from './layout.js';
import { cartCount } from './cart.js';

function tgUrl() {
  const t = CONTACTS.telegram || '';
  if (t.startsWith('http')) return t;
  if (t.startsWith('@')) return `https://t.me/${t.slice(1)}`;
  if (t) return `https://t.me/${t}`;
  return `https://t.me/share/url?url=${encodeURIComponent(location.href)}`;
}

function viberUrl() {
  const raw = CONTACTS.viber || CONTACTS.phoneRaw;
  return `viber://chat?number=${encodeURIComponent(String(raw).replace(/\D/g, ''))}`;
}

export function renderContactFab() {
  return `
    <div class="fab-contact" id="fab-contact">
      <button type="button" class="fab-contact-toggle" id="fab-contact-toggle" aria-expanded="false" aria-haspopup="true" aria-label="Связаться с нами">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z"/></svg>
        <span class="fab-contact-label">Связь</span>
      </button>
      <div class="fab-contact-menu" id="fab-contact-menu" hidden>
        <a class="fab-contact-item fab-contact-item--wa" href="${waUrl()}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a class="fab-contact-item" href="${telUrl()}">Телефон</a>
        <a class="fab-contact-item" href="${tgUrl()}" target="_blank" rel="noopener noreferrer">Telegram</a>
        <a class="fab-contact-item" href="${viberUrl()}">Viber</a>
      </div>
    </div>
  `;
}

export function renderFloatingCart() {
  const count = cartCount();
  return `
    <a class="fab-cart ${count ? 'fab-cart--has-items' : ''}" href="${pageHref('/cart.html')}" aria-label="Корзина${count ? `, ${count} товаров` : ''}">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M6 6L5 3H2"/>
      </svg>
      <span class="fab-cart-badge" data-fab-cart-badge ${count ? '' : 'hidden'}>${count || ''}</span>
      <span class="fab-cart-text">Корзина</span>
    </a>
  `;
}

let fabListenersBound = false;

function bindContactMenu() {
  const toggle = document.getElementById('fab-contact-toggle');
  const menu = document.getElementById('fab-contact-menu');
  toggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menu?.hidden !== false;
    if (menu) menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  });
}

function refreshFloatingCart() {
  const slot = document.getElementById('fab-contact-slot');
  if (!slot) return;
  slot.innerHTML = renderContactFab() + renderFloatingCart();
  bindContactMenu();
}

export function mountFloatingUi() {
  if (!document.getElementById('fab-contact-slot')) {
    const slot = document.createElement('div');
    slot.id = 'fab-contact-slot';
    slot.className = 'fab-slot';
    document.body.appendChild(slot);
  }
  refreshFloatingCart();

  if (!fabListenersBound) {
    fabListenersBound = true;
    document.addEventListener('click', () => {
      const menu = document.getElementById('fab-contact-menu');
      const toggle = document.getElementById('fab-contact-toggle');
      if (menu) menu.hidden = true;
      toggle?.setAttribute('aria-expanded', 'false');
    });
    window.addEventListener('cart-updated', refreshFloatingCart);
  }
}

export function updateCatalogCartBtn() {
  const btn = document.getElementById('catalog-cart-btn');
  if (!btn) return;
  const n = cartCount();
  btn.hidden = !n;
  const badge = btn.querySelector('[data-catalog-cart-badge]');
  if (badge) {
    badge.textContent = n;
    badge.hidden = !n;
  }
}
