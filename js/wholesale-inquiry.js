import { SITE } from './config.js';
import { sendToManager } from './contact-send.js';

function buildMessage({ name, phone }) {
  return [
    `Оптовая заявка ${SITE.brand}`,
    '',
    `Имя: ${name}`,
    `Телефон: ${phone}`,
  ].join('\n');
}

function submitLead({ name, phone }) {
  const message = buildMessage({ name, phone });
  sendToManager({ message });
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
  setTimeout(() => el.classList.remove('is-visible'), 2600);
}

function renderLeadForm() {
  return `
    <section class="wholesale-lead-card" aria-labelledby="wholesale-lead-title">
      <h2 id="wholesale-lead-title" class="wholesale-lead-title">Оставить заявку</h2>
      <p class="wholesale-lead-text">Укажите имя и телефон — менеджер свяжется для расчёта опта.</p>
      <form class="wholesale-inline-form" id="wholesale-form" novalidate>
        <label class="field">
          <span class="field-label">Ваше имя</span>
          <input name="name" type="text" required autocomplete="name" placeholder="Имя">
        </label>
        <label class="field">
          <span class="field-label">Телефон</span>
          <input name="phone" type="tel" required autocomplete="tel" placeholder="+375 29 …">
        </label>
        <p class="form-error" id="wholesale-form-error" hidden></p>
        <button class="btn btn-primary btn-lg btn-glow btn-block" type="submit">Отправить заявку</button>
      </form>
    </section>
  `;
}

function showFormError(msg) {
  const el = document.getElementById('wholesale-form-error');
  if (!el) return;
  el.textContent = msg;
  el.hidden = !msg;
}

export function initWholesaleInquiry() {
  if (document.body.dataset.page !== 'wholesale') return;

  const container = document.querySelector('.page-content');
  if (!container) return;

  const slot = container.querySelector('#wholesale-lead-slot');
  if (slot) {
    slot.innerHTML = renderLeadForm();
  } else if (!document.getElementById('wholesale-form')) {
    container.insertAdjacentHTML('afterbegin', renderLeadForm());
  }

  document.getElementById('wholesale-modal')?.remove();

  const form = document.getElementById('wholesale-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    showFormError('');

    const fd = new FormData(form);
    const name = fd.get('name')?.trim();
    const phone = fd.get('phone')?.trim();

    if (!name || !phone) {
      showFormError('Укажите имя и телефон.');
      return;
    }

    submitLead({ name, phone });
    showToast('Заявка отправлена');
    form.reset();
  });
}
