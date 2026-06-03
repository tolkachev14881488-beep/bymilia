import { CONTACTS, SITE } from './config.js';
import { PRODUCTS } from './products.js';

const MODAL_ID = 'wholesale-modal';

function colorOptions() {
  if (!PRODUCTS.length) {
    return '<option value="">Уточню у менеджера</option>';
  }
  return PRODUCTS.map(
    (p) => `<option value="${p.colorName}">${p.colorName}</option>`,
  ).join('');
}

function renderModal() {
  return `
    <div class="modal" id="${MODAL_ID}" hidden aria-hidden="true">
      <div class="modal-backdrop" data-modal-close tabindex="-1"></div>
      <div class="modal-panel" role="dialog" aria-labelledby="wholesale-modal-title" aria-modal="true">
        <button type="button" class="modal-close" data-modal-close aria-label="Закрыть">×</button>
        <p class="modal-eyebrow">Опт от 10 пар</p>
        <h2 id="wholesale-modal-title" class="modal-title">Заявка менеджеру</h2>
        <p class="modal-lead">Заполните форму — откроем WhatsApp с готовым текстом и продублируем на почту.</p>
        <form class="checkout-form wholesale-form" id="wholesale-form">
          <label>Коллектив / студия <input name="collective" required autocomplete="organization" placeholder="Название группы"></label>
          <label>Контактное лицо <input name="name" required autocomplete="name" placeholder="Имя тренера или родителя"></label>
          <label>Телефон <input name="phone" type="tel" required autocomplete="tel" placeholder="+375 …"></label>
          <label>Email <input name="email" type="email" autocomplete="email" placeholder="Необязательно"></label>
          <label>Количество пар (мин. 10)
            <input name="qty" type="number" min="10" max="999" value="10" required>
          </label>
          <label>Расцветки
            <select name="colors" multiple size="4">${colorOptions()}</select>
            <span class="field-hint">Удерживайте Ctrl (Cmd на Mac), чтобы выбрать несколько</span>
          </label>
          <label>Размеры и количество
            <textarea name="sizes" placeholder="Например: 28–30 — 4 пары, 31–33 — 6 пар…"></textarea>
          </label>
          <label>Комментарий <textarea name="comment" placeholder="Сроки, город, печать логотипа…"></textarea></label>
          <button class="btn btn-primary btn-lg btn-glow btn-block" type="submit">Отправить заявку менеджеру</button>
        </form>
      </div>
    </div>
  `;
}

function buildWholesaleMessage(data) {
  const selected = [...(data.colors || [])];
  const colorsText = selected.length ? selected.join(', ') : '—';

  return [
    `Оптовая заявка ${SITE.brand}`,
    '',
    `Коллектив: ${data.collective}`,
    `Контакт: ${data.name}`,
    `Телефон: ${data.phone}`,
    `Email: ${data.email || '—'}`,
    `Количество пар: ${data.qty}`,
    `Расцветки: ${colorsText}`,
    `Размеры: ${data.sizes || '—'}`,
    data.comment ? `Комментарий: ${data.comment}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function submitWholesale(data) {
  const message = buildWholesaleMessage(data);
  const waUrl = `https://wa.me/${CONTACTS.whatsapp}?text=${encodeURIComponent(message)}`;
  const mailUrl = `mailto:${CONTACTS.email}?subject=${encodeURIComponent(`Опт ${SITE.brand} — ${data.collective}`)}&body=${encodeURIComponent(message)}`;

  window.open(waUrl, '_blank');
  window.location.href = mailUrl;
  return message;
}

function getModal() {
  return document.getElementById(MODAL_ID);
}

function openModal() {
  const modal = getModal();
  if (!modal) return;
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  const first = modal.querySelector('input, select, textarea');
  first?.focus();
}

function closeModal() {
  const modal = getModal();
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

export function initWholesaleInquiry() {
  if (!document.body.dataset.page || document.body.dataset.page !== 'wholesale') return;

  if (!getModal()) {
    document.body.insertAdjacentHTML('beforeend', renderModal());
  }

  const modal = getModal();
  const form = document.getElementById('wholesale-form');

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-wholesale-open]')) {
      e.preventDefault();
      openModal();
    }
    if (e.target.closest('[data-modal-close]')) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const colors = fd.getAll('colors').filter(Boolean);
    const data = {
      collective: fd.get('collective')?.trim(),
      name: fd.get('name')?.trim(),
      phone: fd.get('phone')?.trim(),
      email: fd.get('email')?.trim(),
      qty: fd.get('qty'),
      colors,
      sizes: fd.get('sizes')?.trim(),
      comment: fd.get('comment')?.trim(),
    };

    if (!data.collective || !data.name || !data.phone) return;
    if (Number(data.qty) < 10) {
      alert('Минимальная партия — 10 пар.');
      return;
    }

    submitWholesale(data);
    closeModal();
    form.reset();
    const qtyInput = form.querySelector('[name="qty"]');
    if (qtyInput) qtyInput.value = '10';
  });
}
