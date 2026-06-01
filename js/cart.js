import { getProduct } from './products.js';

const STORAGE_KEY = 'bymilia_cart';

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
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
  const items = getCart();
  const key = `${productId}:${sizeId}`;
  const existing = items.find((i) => i.key === key);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({ key, productId, sizeId, qty });
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
