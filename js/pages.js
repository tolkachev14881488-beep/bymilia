import { DELIVERY_OPTIONS, SIZES, SITE } from './config.js';
import { PRODUCTS, getProduct, sku } from './products.js';
import { addToCart, getCart, cartTotal, updateQty, removeLine } from './cart.js';
import { submitOrder } from './checkout.js';
import { asset, pageHref } from './layout.js';

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

const ASSET_CACHE_VERSION = '20260602';

function productImageSrc(src, product) {
  if (src.startsWith('http')) return src;
  const v = product?.imageVersion || ASSET_CACHE_VERSION;
  return `${asset(src)}?v=${encodeURIComponent(v)}`;
}

function productImageList(p) {
  const list = Array.isArray(p.images) && p.images.length ? p.images : p.image ? [p.image] : [];
  return list.map((src) => productImageSrc(src, p));
}

function productThumb(p) {
  const shape = `<div class="product-card-shape product-card-shape--fallback" style="background: ${p.colorHex}" hidden></div>`;
  const imgs = productImageList(p);
  if (imgs[0]) {
    const ref = imgs[0].startsWith('http') ? ' referrerpolicy="no-referrer"' : '';
    return `${shape}<img class="product-card-img" src="${imgs[0]}" alt="${p.colorName}" loading="lazy" width="400" height="400"${ref} onerror="this.hidden=true;this.previousElementSibling.hidden=false">`;
  }
  return `<div class="product-card-shape" style="background: ${p.colorHex}"></div>`;
}

function productGallery(p, activeIndex = 0) {
  const imgs = productImageList(p);
  if (!imgs.length) {
    return `<div class="product-shape" style="background: ${p.colorHex}"></div>`;
  }
  const idx = Math.min(activeIndex, imgs.length - 1);
  const ref = imgs[idx].startsWith('http') ? ' referrerpolicy="no-referrer"' : '';
  const thumbs =
    imgs.length > 1
      ? `<div class="product-gallery-thumbs" role="tablist" aria-label="Фото товара">${imgs
          .map(
            (src, i) =>
              `<button type="button" class="product-thumb-btn ${i === idx ? 'is-active' : ''}" data-gallery-idx="${i}" role="tab" aria-selected="${i === idx}"><img src="${src}" alt=""></button>`,
          )
          .join('')}</div>`
      : '';
  return `
    <div class="product-shape product-shape--fallback" style="background: ${p.colorHex}" hidden></div>
    <img class="product-photo" src="${imgs[idx]}" alt="${p.colorName}" width="600" height="600"${ref} data-gallery-main onerror="this.hidden=true;this.previousElementSibling.hidden=false">
    ${thumbs}
  `;
}

function formatPrice(p, large = false) {
  const cls = large ? 'product-price product-price--lg' : 'product-price';
  if (p.oldPrice && p.oldPrice > p.price) {
    return `<span class="product-price-old">${p.oldPrice} ${SITE.currencyLabel}</span> <span class="${cls}">${p.price} ${SITE.currencyLabel}</span>`;
  }
  return `<span class="${cls}">${p.price} ${SITE.currencyLabel}</span>`;
}

export function renderProductGrid(container) {
  if (!container) return;
  if (!PRODUCTS.length) {
    container.innerHTML =
      '<p class="empty-state">Каталог пока пуст. Добавьте товары в админке.</p>';
    return;
  }
  container.innerHTML = PRODUCTS.map(
    (p) => `
    <a class="product-card" href="${pageHref(`/product.html?id=${p.id}`)}">
      <div class="product-card-thumb" style="--card-glow: ${p.colorHex}33">
        <span class="product-card-badge">6 размеров</span>
        ${productThumb(p)}
        <span class="product-card-cta">Смотреть →</span>
      </div>
      <div class="product-card-body">
        <h3 class="product-card-title">${p.colorName}</h3>
        <p class="product-price-wrap">${formatPrice(p)}</p>
      </div>
    </a>
  `,
  ).join('');
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
  let galleryIndex = 0;

  function render() {
    root.innerHTML = `
      <nav class="breadcrumb container"><a href="${pageHref('/index.html')}">Главная</a> / <a href="${pageHref('/catalog.html')}">Каталог</a> / ${product.colorName}</nav>
      <div class="container product-layout">
        <div class="product-gallery">
          ${productGallery(product, galleryIndex)}
        </div>
        <div class="product-panel">
          <span class="eyebrow">${SITE.brand}</span>
          <h1>${product.colorName}</h1>
          <p class="product-price-wrap product-price-wrap--lg">${formatPrice(product, true)}</p>
          ${product.wbNm ? `<p class="product-meta">Артикул WB: ${product.wbNm}</p>` : ''}
          <p>${product.description}</p>
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
          ${product.wbUrl ? `<a class="btn btn-outline-orange btn-lg btn-block" href="${product.wbUrl}" target="_blank" rel="noopener noreferrer">Купить на Wildberries</a>` : ''}
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

    root.querySelectorAll('[data-gallery-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        galleryIndex = Number(btn.dataset.galleryIdx);
        render();
      });
    });

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
          <div class="cart-line-swatch" style="${productImageList(p)[0] ? `background:url('${productImageList(p)[0]}') center/cover` : `background:${p.colorHex}`}"></div>
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
