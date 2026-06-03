import { getProduct, normalizeProductId } from './products.js';

const STORAGE_KEY = 'bymilia_cart';

export function getCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const items = raw.map((line) => {
      const productId = normalizeProductId(line.productId);
      const key = `${productId}:${line.sizeId}`;
      return { ...line, productId, key };
    });
    const changed = items.some(
      (line, i) =>
        line.key !== raw[i]?.key || line.productId !== raw[i]?.productId,
    );
    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('cart-updated'));
    }
    return items;
  } catch {
    return [];
  }
}

export function saveCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('cart-updated'));
}

export function cartCount() {
  return getCart().reduce((sum, line) => sum + line.qty, 0);
}

export function cartTotal() {
  return getCart().reduce((sum, line) => {
    const p = getProduct(line.productId);
    return sum + (p?.price ?? 0) * line.qty;
  }, 0);
}

export function addToCart({ productId, sizeId, qty = 1 }) {
  const pid = normalizeProductId(productId);
  const items = getCart();
  const key = `${pid}:${sizeId}`;
  const existing = items.find((i) => i.key === key);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({ key, productId: pid, sizeId, qty });
  }
  saveCart(items);
}

export function updateQty(key, qty) {
  let items = getCart();
  if (qty <= 0) {
    items = items.filter((i) => i.key !== key);
  } else {
    const line = items.find((i) => i.key === key);
    if (line) line.qty = qty;
  }
  saveCart(items);
}

export function removeLine(key) {
  saveCart(getCart().filter((i) => i.key !== key));
}

export function clearCart() {
  saveCart([]);
}
