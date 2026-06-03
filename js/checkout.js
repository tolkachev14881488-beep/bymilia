import { DELIVERY_OPTIONS, SITE } from './config.js';
import { getProduct, sku, SIZES } from './products.js';
import { getCart, cartTotal, clearCart } from './cart.js';
import { sendToManager } from './contact-send.js';

function formatLine(line) {
  const product = getProduct(line.productId);
  const size = SIZES.find((s) => s.id === line.sizeId);
  if (!product) return '';
  const art = sku(product, line.sizeId);
  return `• ${product.colorName}, размер ${size?.label} — ${line.qty} шт. × ${product.price} ${SITE.currencyLabel} (${art})`;
}

export function buildOrderMessage(formData) {
  const lines = getCart().map(formatLine).filter(Boolean);
  const total = cartTotal();
  const delivery = DELIVERY_OPTIONS.find((d) => d.id === formData.delivery)?.label || formData.delivery;

  return [
    `Заказ ${SITE.brand}`,
    '',
    ...lines,
    '',
    `Итого: ${total.toFixed(2)} ${SITE.currencyLabel}`,
    '',
    `ФИО: ${formData.name}`,
    `Телефон: ${formData.phone}`,
    `Email: ${formData.email}`,
    `Доставка: ${delivery}`,
    `Адрес: ${formData.address || '—'}`,
    formData.comment ? `Комментарий: ${formData.comment}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function submitOrder(formData) {
  const message = buildOrderMessage(formData);
  sendToManager({ message });
  clearCart();
  return message;
}
