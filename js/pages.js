import { DELIVERY_OPTIONS, SIZES, SITE } from './config.js';
import { PRODUCTS, getProduct, sku } from './products.js';
import { addToCart, getCart, cartTotal, updateQty, removeLine } from './cart.js';
import { submitOrder } from './checkout.js';
import { pageHref } from './layout.js';

function showToast(text) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.classList.add('is-visible');
  setTimeout(() => el.classList.remove('is-visible'), 2200);
}

function renderCardMedia(product) {
  if (product.image) {
    return `<img class="product-card-img" src="${product.image}" alt="${product.colorName}" loading="lazy" width="400" height="400">`;
  }
  return `<div class="product-card-shape" style="background:${product.colorHex}"></div>`;
}

function renderGalleryMedia(product) {
  if (product.image) {
    return `<img src="${product.image}" alt="${product.colorName}" class="product-gallery-img" width="600" height="600">`;
  }
  return `<div class="product-gallery-fallback"><div class="product-shape" style="background:${product.colorHex}"></div></div>`;
}

function renderCartMedia(product) {
  if (product.image) {
    return `<img class="cart-line-img" src="${product.image}" alt="" width="72" height="72">`;
  }
  return `<div class="cart-line-swatch" style="background:${product.colorHex}"></div>`;
}

export function renderProductGrid(container) {
  if (!container) return;
  container.innerHTML = PRODUCTS.map(
    (p) => `
    <a class="product-card reveal" href="${pageHref(`/product.html?id=${p.id}`)}">
      <div class="product-card-thumb" style="--card-glow: ${p.colorHex}44">
        <span class="product-card-badge">6 размеров</span>
        ${renderCardMedia(p)}
        <span class="product-card-swatch" style="background:${p.colorHex}" title="${p.colorName}"></span>
        <span class="product-card-cta">Смотреть →</span>
      </div>
      <div class="product-card-body">
        <h3>${p.colorName}</h3>
        <p class="product-subtitle">${p.subtitle}</p>
        <p class="product-price">${p.price} ${SITE.currencyLabel}
          ${p.oldPrice ? `<span class="product-price-old">${p.oldPrice} ${SITE.currencyLabel}</span>` : ''}
        </p>
      </div>
    </a>
  `,
  ).join('');

  import('./motion.js').then(({ observeReveals }) => observeReveals(container));
}

export function initProductPage() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const product = getProduct(id);
  const root = document.getElementById('product-root');
  if (!product || !root) {
    if (root) {
      root.innerHTML =
        '<p class="empty-state">Товар не найден. <a href="catalog.html">В каталог</a></p>';
    }
    return;
  }

  document.title = `${product.colorName} — ${SITE.brand}`;

  let selectedSize = null;
  let qty = 1;

  function render() {
    const descFull = product.description.split('\n\n').map((t) => `<p>${t}</p>`).join('');

    root.innerHTML = `
      <nav class="breadcrumb container"><a href="${pageHref('/index.html')}">Главная</a> / <a href="${pageHref('/catalog.html')}">Каталог</a> / ${product.colorName}</nav>
      <div class="container product-layout">
        <div class="product-gallery">
          ${renderGalleryMedia(product)}
        </div>
        <div class="product-panel">
          <span class="eyebrow">${SITE.brand}</span>
          <h1>${product.colorName}</h1>
          <p class="product-meta">${product.subtitle} · арт. ${product.skuPrefix}</p>
          <p class="product-price product-price-lg">${product.price} ${SITE.currencyLabel}
            ${product.oldPrice ? `<span class="product-price-old">${product.oldPrice} ${SITE.currencyLabel}</span>` : ''}
          </p>
          <p class="product-desc-short">${product.description.split('\n\n')[0]}</p>
          <details class="product-details">
            <summary>Полное описание</summary>
            <div class="product-details-body">${descFull}</div>
          </details>
          <p><strong>Размер (длина стопы, см)</strong></p>
          <div class="size-picker" role="group" aria-label="Выбор размера"></div>
          <div class="qty-row">
            <span>Количество</span>
            <div class="qty-control">
              <button type="button" data-qty-minus aria-label="Меньше">−</button>
              <input type="number" min="1" max="99" value="${qty}" data-qty-input aria-label="Количество">
              <button type="button" data-qty-plus aria-label="Больше">+</button>
            </div>
          </div>
          <button class="btn btn-primary btn-lg btn-glow btn-block" type="button" data-add-cart>Добавить в корзину</button>
          <ul class="feature-list">
            ${product.features.map((f) => `<li>${f}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;

    const picker = root.querySelector('.size-picker');
    picker.innerHTML = SIZES.map(
      (s) =>
        `<button type="button" class="size-btn ${selectedSize === s.id ? 'is-active' : ''}" data-size="${s.id}">${s.label}</button>`,
    ).join('');

    picker.querySelectorAll('[data-size]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedSize = btn.dataset.size;
        render();
      });
    });

    root.querySelector('[data-qty-minus]')?.addEventListener('click', () => {
      qty = Math.max(1, qty - 1);
      render();
    });
    root.querySelector('[data-qty-plus]')?.addEventListener('click', () => {
      qty = Math.min(99, qty + 1);
      render();
    });
    root.querySelector('[data-qty-input]')?.addEventListener('change', (e) => {
      qty = Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1));
      render();
    });

    root.querySelector('[data-add-cart]')?.addEventListener('click', () => {
      if (!selectedSize) {
        showToast('Выберите размер');
        return;
      }
      addToCart({ productId: product.id, sizeId: selectedSize, qty });
      showToast('Добавлено в корзину');
    });
  }

  render();
}

export function initCartPage() {
  const linesEl = document.getElementById('cart-lines');
  const summaryEl = document.getElementById('cart-summary');
  const form = document.getElementById('checkout-form');
  if (!linesEl) return;

  function render() {
    const cart = getCart();
    if (!cart.length) {
      linesEl.innerHTML = `<div class="empty-state"><p>Корзина пуста</p><a class="btn btn-primary" href="${pageHref('/catalog.html')}">Перейти в каталог</a></div>`;
      if (summaryEl) summaryEl.hidden = true;
      if (form) form.hidden = true;
      return;
    }

    if (summaryEl) summaryEl.hidden = false;
    if (form) form.hidden = false;

    linesEl.innerHTML = cart
      .map((line) => {
        const p = getProduct(line.productId);
        const size = SIZES.find((s) => s.id === line.sizeId);
        if (!p) return '';
        return `
        <div class="cart-line" data-key="${line.key}">
          ${renderCartMedia(p)}
          <div>
            <strong>${p.colorName}</strong><br>
            <span style="color:var(--ink-muted);font-size:0.88rem">Размер ${size?.label} · ${sku(p, line.sizeId)}</span>
            <div class="qty-row" style="margin:0.5rem 0 0">
              <div class="qty-control">
                <button type="button" data-dec>−</button>
                <span style="padding:0 0.75rem">${line.qty}</span>
                <button type="button" data-inc>+</button>
              </div>
              <button type="button" class="btn btn-ghost btn-sm" data-remove>Удалить</button>
            </div>
          </div>
          <div><strong>${(p.price * line.qty).toFixed(2)} ${SITE.currencyLabel}</strong></div>
        </div>`;
      })
      .join('');

    const total = cartTotal();
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="cart-summary-row"><span>Позиций</span><span>${cart.reduce((s, l) => s + l.qty, 0)}</span></div>
        <div class="cart-summary-row cart-total"><span>Итого</span><span>${total.toFixed(2)} ${SITE.currencyLabel}</span></div>
        <p style="font-size:0.85rem;color:var(--ink-muted);margin:1rem 0 0">Оплата и точная стоимость доставки — по согласованию с менеджером после заявки.</p>
      `;
    }

    linesEl.querySelectorAll('.cart-line').forEach((row) => {
      const key = row.dataset.key;
      const line = cart.find((l) => l.key === key);
      row.querySelector('[data-dec]')?.addEventListener('click', () => updateQty(key, line.qty - 1));
      row.querySelector('[data-inc]')?.addEventListener('click', () => updateQty(key, line.qty + 1));
      row.querySelector('[data-remove]')?.addEventListener('click', () => removeLine(key));
    });
  }

  if (form) {
    const deliverySelect = form.querySelector('[name="delivery"]');
    deliverySelect.innerHTML = DELIVERY_OPTIONS.map(
      (o) => `<option value="${o.id}">${o.label} — ${o.hint}</option>`,
    ).join('');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());
      if (!data.name?.trim() || !data.phone?.trim()) {
        showToast('Укажите имя и телефон');
        return;
      }
      submitOrder(data);
      showToast('Заявка отправлена');
      setTimeout(() => {
        window.location.href = pageHref('/index.html');
      }, 800);
    });
  }

  render();
  window.addEventListener('cart-updated', render);
}
