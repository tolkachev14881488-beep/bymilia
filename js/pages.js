import { DELIVERY_OPTIONS, SIZES, SITE, DELIVERY } from './config.js';
import { PRODUCTS, getProduct, getProductSpecs, sku } from './products.js';
import { addToCart, getCart, cartTotal, updateQty, removeLine, saveCart, cartCount } from './cart.js';
import { renderManagerCard } from './manager.js';
import { submitOrder } from './checkout.js';
import { asset, assetUrl, pageHref } from './layout.js';
import { applySeo, breadcrumbJsonLd, injectJsonLd, pageUrl } from './seo.js';

function renderCartUpsell(cart) {
  const inCart = new Set(cart.map((line) => line.productId));
  const others = PRODUCTS.filter((p) => !inCart.has(p.id)).slice(0, 3);
  const catalog = pageHref('/catalog.html');
  if (!others.length) {
    return `
      <div class="cart-continue">
        <p class="cart-continue-text">Все расцветки уже в корзине — отличный выбор для коллектива или на смену в раздевалке.</p>
        <a class="btn btn-ghost" href="${catalog}">Вернуться в каталог</a>
      </div>`;
  }
  return `
    <div class="cart-upsell">
      <p class="cart-upsell-title">Добавить ещё расцветку?</p>
      <p class="cart-upsell-lead">Удобно подобрать под танцевальный костюм или настроение</p>
      <div class="cart-upsell-grid">
        ${others
          .map((p) => {
            const img = productImageList(p)[0];
            const label = p.colorName;
            const thumb = img
              ? `<img src="${escapeHtml(img)}" alt="" width="52" height="52" loading="lazy">`
              : `<span class="cart-upsell-swatch" style="background:${p.colorHex}"></span>`;
            return `<a class="cart-upsell-card" href="${pageHref(`/product.html?id=${p.id}`)}">${thumb}<span>${escapeHtml(label)}</span></a>`;
          })
          .join('')}
      </div>
      <a class="btn btn-ghost btn-sm" href="${catalog}">Смотреть весь каталог →</a>
    </div>`;
}

function renderCartFilled(cart) {
  const linesHtml = cart
    .map((line) => {
      const p = getProduct(line.productId);
      const size = SIZES.find((s) => s.id === line.sizeId);
      if (!p) return '';
      const productUrl = pageHref(`/product.html?id=${line.productId}`);
      const img = productImageList(p)[0];
      const thumbHtml = img
        ? `<div class="cart-line-thumb"><img class="cart-line-img" src="${escapeHtml(img)}" alt="${escapeHtml(p.colorName)}" width="72" height="72" loading="lazy"></div>`
        : `<div class="cart-line-thumb cart-line-thumb--color" style="background:${p.colorHex}"></div>`;
      return `
        <div class="cart-line" data-key="${line.key}">
          <a class="cart-line-media" href="${productUrl}">
            ${thumbHtml}
          </a>
          <div class="cart-line-main">
            <div class="cart-line-header">
              <div class="cart-line-info">
                <a class="cart-line-title" href="${productUrl}">${escapeHtml(p.colorName)}</a>
                <span class="cart-line-meta">Размер ${escapeHtml(size?.label || '')} · ${escapeHtml(sku(p, line.sizeId))}</span>
              </div>
              <strong class="cart-line-price">${(p.price * line.qty).toFixed(2)} ${SITE.currencyLabel}</strong>
            </div>
            <div class="cart-line-footer qty-row">
              <div class="qty-control">
                <button type="button" data-dec aria-label="Уменьшить">−</button>
                <span class="qty-value">${line.qty}</span>
                <button type="button" data-inc aria-label="Увеличить">+</button>
              </div>
              <button type="button" class="btn btn-ghost btn-sm cart-line-remove" data-remove>Удалить</button>
            </div>
          </div>
        </div>`;
    })
    .join('');

  const itemCount = cart.reduce((sum, line) => sum + line.qty, 0);

  return `
    <div class="cart-motivation">
      <p class="cart-motivation-title">Отличный выбор — осталось оформить заявку</p>
      <p class="cart-motivation-text">отправка на следующий день при наличии товаров</p>
    </div>
    <div class="cart-lines-list">${linesHtml}</div>
    ${renderCartUpsell(cart)}
    <div class="cart-actions-row">
      <a class="btn btn-ghost" href="${pageHref('/catalog.html')}">← Продолжить покупки</a>
      <a class="btn btn-primary btn-glow cart-actions-order" href="#checkout-form">Отправить заявку →</a>
    </div>
    <p class="cart-items-note">${itemCount} ${itemCount === 1 ? 'пара' : itemCount < 5 ? 'пары' : 'пар'} в корзине — можно добавить другие размеры или расцветки</p>`;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const SIZE_BADGE = 'Размер 25–42';

function renderProductSpecs(product) {
  const specs = getProductSpecs(product);
  if (!specs?.items?.length) return '';
  const title = specs.title || 'Основная информация';
  return `
    <details class="product-specs">
      <summary class="product-specs-title">${escapeHtml(title)}</summary>
      <dl class="product-specs-list">
        ${specs.items
          .map(
            ({ label, value }) => `
          <div class="product-specs-row">
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(value)}</dd>
          </div>`,
          )
          .join('')}
      </dl>
    </details>`;
}

export function updateCatalogCartBtn() {
  const n = cartCount();
  const btn = document.getElementById('catalog-cart-btn');
  if (btn) {
    btn.hidden = !n;
    btn.textContent = n ? `Корзина (${n})` : 'Корзина';
  }
}

export function initCatalogSeo() {
  applySeo({
    title: 'Каталог сапожек By Milia — 4 расцветки, размеры 25–42 см',
    description:
      'Купить сапожки для разогрева стоп By Milia: чёрный, тропический и яркий принт, классика. Цены, фото, доставка по Беларуси. Менеджер в WhatsApp.',
    path: 'catalog.html',
  });
  breadcrumbJsonLd([
    { name: 'Главная', path: 'index.html' },
    { name: 'Каталог', path: 'catalog.html' },
  ]);
  const slot = document.getElementById('catalog-manager');
  if (slot) {
    slot.classList.add('catalog-manager-block');
    slot.innerHTML = renderManagerCard({
      compact: true,
      showSizeChart: true,
      title: 'Помочь с выбором расцветки и размера, вопросы по доставке?',
    });
  }
  updateCatalogCartBtn();
  window.addEventListener('cart-updated', updateCatalogCartBtn);
}

export function initCartSeo() {
  applySeo({
    title: 'Корзина и оформление заказа — By Milia',
    description:
      'Оформите заказ сапожек By Milia: корзина, доставка по Беларуси, заявка в WhatsApp. Самовывоз в Минске, Европочта, курьер.',
    path: 'cart.html',
    noindex: true,
  });
}

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
  return `${assetUrl(src)}?v=${encodeURIComponent(v)}`;
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
      <div class="product-card-thumb product-card-thumb--${p.id}" style="--card-glow: ${p.colorHex}33">
        <span class="product-card-badge">${SIZE_BADGE}</span>
        ${productThumb(p)}
        <span class="product-card-cta">Смотреть →</span>
      </div>
      <div class="product-card-body">
        <h3 class="product-card-title">${p.colorName}</h3>
        <p class="product-price-wrap">${formatPrice(p)}</p>
        <p class="product-card-delivery">Бесплатная доставка по Беларуси</p>
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
      root.innerHTML = `<p class="empty-state">Товар не найден. <a href="${pageHref('/catalog.html')}">В каталог</a></p>`;
    }
    return;
  }

  const desc =
    (product.description || '').slice(0, 155) +
    ' Заказ на сайте By Milia, доставка по Беларуси.';
  applySeo({
    title: `${product.colorName} — сапожки By Milia | купить в Минске`,
    description: desc,
    path: `product.html?id=${product.id}`,
    image: product.image ? asset(product.image) : undefined,
    type: 'product',
  });
  breadcrumbJsonLd([
    { name: 'Главная', path: 'index.html' },
    { name: 'Каталог', path: 'catalog.html' },
    { name: product.colorName, path: `product.html?id=${product.id}` },
  ]);
  const rawImg = productImageList(product)[0]?.split('?')[0];
  const schemaImage = rawImg
    ? rawImg.startsWith('http')
      ? rawImg
      : pageUrl(rawImg.replace(/^\.\.\//, ''))
    : undefined;
  injectJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.colorName} — ${SITE.brand}`,
    description: product.description,
    image: schemaImage,
    brand: { '@type': 'Brand', name: SITE.brand },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'BYN',
      availability: 'https://schema.org/InStock',
      url: pageUrl(`product.html?id=${product.id}`),
    },
  });

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
          <p class="product-delivery-note">Бесплатная доставка по Беларуси</p>
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
          ${renderProductSpecs(product)}
          ${renderManagerCard({
            compact: true,
            showSizeChart: true,
            title: 'Как подобрать размер?',
            text: 'Если остались вопросы — свяжитесь с менеджером',
            waText: `Здравствуйте! Интересует «${product.colorName}» By Milia.`,
          })}
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
  initCartSeo();
  const linesEl = document.getElementById('cart-lines');
  const summaryEl = document.getElementById('cart-summary');
  const form = document.getElementById('checkout-form');
  const asideEl = document.getElementById('cart-aside');
  if (!linesEl) return;

  function pruneInvalidLines() {
    const all = getCart();
    const valid = all.filter((line) => getProduct(line.productId));
    if (valid.length !== all.length) saveCart(valid);
    return valid;
  }

  function setMobileBar(cart, total) {
    const mobileBar = document.getElementById('cart-mobile-bar');
    const mobileSum = document.getElementById('cart-mobile-sum');
    if (!mobileBar) return;
    if (!cart.length) {
      mobileBar.hidden = true;
      document.body.classList.remove('has-cart-bar');
      return;
    }
    mobileBar.hidden = false;
    document.body.classList.add('has-cart-bar');
    if (mobileSum) mobileSum.textContent = `${total.toFixed(2)} ${SITE.currencyLabel}`;
  }

  function showOrderSuccess() {
    if (asideEl) asideEl.hidden = true;
    setMobileBar([], 0);
    linesEl.innerHTML = `
      <div class="empty-state cart-success">
        <p><strong>Заявка отправлена</strong></p>
        <p>Спасибо! Мы свяжемся с вами для уточнения деталей.</p>
        <a class="btn btn-primary btn-lg btn-glow" href="${pageHref('/catalog.html')}">В каталог</a>
        <a class="btn btn-ghost" href="${pageHref('/index.html')}">На главную</a>
      </div>`;
  }

  function render() {
    const cart = pruneInvalidLines();
    const headLead = document.getElementById('cart-head-lead');

    if (!cart.length) {
      if (headLead) {
        headLead.textContent = 'Выберите расцветку и размер — согреют ножки перед занятием';
        headLead.hidden = false;
      }
      linesEl.innerHTML = `
        <div class="empty-state cart-empty">
          <p class="cart-empty-title">Пока пусто — самое время выбрать сапожки</p>
          <p class="cart-empty-text">Четыре яркие расцветки, размеры 25–42. Заказ без регистрации — менеджер поможет с размером.</p>
          <div class="cart-empty-actions">
            <a class="btn btn-primary btn-lg btn-glow" href="${pageHref('/catalog.html')}">Выбрать расцветку</a>
            <a class="btn btn-ghost" href="${pageHref('/index.html')}">На главную</a>
          </div>
        </div>`;
      if (asideEl) asideEl.hidden = true;
      setMobileBar([], 0);
      return;
    }

    if (headLead) headLead.hidden = true;

    if (asideEl) asideEl.hidden = false;

    linesEl.innerHTML = renderCartFilled(cart);

    const total = cartTotal();
    const itemCount = cart.reduce((s, l) => s + l.qty, 0);
    setMobileBar(cart, total);
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="cart-order-nudge">
          <p class="cart-order-nudge-title">Оформите заявку — мы на связи</p>
          <p>Оплата и доставка — после согласования с менеджером</p>
        </div>
        <div class="cart-summary-row"><span>Позиций</span><span>${itemCount}</span></div>
        <div class="cart-summary-row cart-total"><span>Итого</span><span>${total.toFixed(2)} ${SITE.currencyLabel}</span></div>
        <p class="cart-summary-note">Белпочта и европочта — бесплатно от 80р по всей Беларуси, курьер по Минску и Беларуси от 400р — бесплатно.</p>
      `;
    }

    linesEl.querySelectorAll('.cart-line').forEach((row) => {
      const key = row.dataset.key;
      row.querySelector('[data-dec]')?.addEventListener('click', () => {
        const line = getCart().find((l) => l.key === key);
        if (line) updateQty(key, line.qty - 1);
      });
      row.querySelector('[data-inc]')?.addEventListener('click', () => {
        const line = getCart().find((l) => l.key === key);
        if (line) updateQty(key, line.qty + 1);
      });
      row.querySelector('[data-remove]')?.addEventListener('click', () => removeLine(key));
    });
  }

  if (form) {
    const deliverySelect = form.querySelector('[name="delivery"]');
    if (deliverySelect) {
      deliverySelect.innerHTML = DELIVERY_OPTIONS.map(
        (o) => `<option value="${o.id}">${escapeHtml(o.label)}</option>`,
      ).join('');
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const cart = pruneInvalidLines();
      if (!cart.length) {
        showToast('Корзина пуста');
        render();
        return;
      }
      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());
      if (!data.name?.trim() || !data.phone?.trim() || !data.email?.trim()) {
        showToast('Укажите имя, телефон и email');
        return;
      }
      submitOrder(data);
      showToast('Заявка отправлена');
      showOrderSuccess();
    });
  }

  render();
  window.addEventListener('cart-updated', render);
}
