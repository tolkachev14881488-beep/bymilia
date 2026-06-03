import { pageLabel } from './page-labels.js';

const LAST_PUBLISH_KEY = 'bymilia-last-publish';

export function getLastPublishLabel() {
  try {
    const raw = localStorage.getItem(LAST_PUBLISH_KEY);
    if (!raw) return 'Ещё не публиковали';
    const d = new Date(Number(raw));
    return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

export function markPublishedNow() {
  localStorage.setItem(LAST_PUBLISH_KEY, String(Date.now()));
}

export function renderDashboard({ draft, canPublish, publishDetail, localMode }) {
  const el = document.getElementById('dashboard-root');
  if (!el || !draft) return;

  const products = draft.products || [];
  const published = products.filter((p) => p.published !== false);
  const pages = Object.keys(draft.pages || {});
  const heroOk = Boolean(
    draft.homepage?.hero?.titleHtml?.trim() || draft.homepage?.hero?.lead?.trim(),
  );

  const statusClass = canPublish ? 'dash-status--ok' : 'dash-status--warn';
  const statusText = canPublish
    ? localMode
      ? 'Публикация с этого компьютера активна'
      : 'Можно публиковать на сайт из любой точки мира'
    : 'Нужна однократная настройка публикации';

  el.innerHTML = `
    <div class="dash-grid">
      <article class="dash-card dash-card--hero ${statusClass}">
        <p class="dash-eyebrow">Статус</p>
        <h3 class="dash-title">${statusText}</h3>
        <p class="dash-meta">${esc(publishDetail || '')}</p>
        <p class="dash-meta">Последняя публикация: <strong>${esc(getLastPublishLabel())}</strong></p>
        <div class="dash-actions">
          <button type="button" class="btn btn-primary btn-lg" id="dash-publish-btn" ${canPublish ? '' : 'disabled'}>
            Опубликовать всё на сайт
          </button>
          <a class="btn btn-secondary" href="../index.html" target="_blank" rel="noopener">Открыть сайт</a>
          ${canPublish ? '' : '<button type="button" class="btn btn-secondary" data-goto-publish>Настроить публикацию</button>'}
        </div>
      </article>

      <article class="dash-card">
        <p class="dash-eyebrow">Каталог</p>
        <p class="dash-stat">${published.length} <span>из ${products.length} в каталоге</span></p>
        <button type="button" class="btn btn-secondary btn-sm" data-tab-go="products">Редактировать товары</button>
      </article>

      <article class="dash-card">
        <p class="dash-eyebrow">Страницы</p>
        <p class="dash-stat">${pages.length} <span>текстовых страниц</span></p>
        <button type="button" class="btn btn-secondary btn-sm" data-tab-go="pages">Редактировать страницы</button>
      </article>

      <article class="dash-card">
        <p class="dash-eyebrow">Главная</p>
        <p class="dash-stat">${heroOk ? 'Заполнена' : 'Пустая — нажмите «С сайта»'}</p>
        <button type="button" class="btn btn-secondary btn-sm" data-tab-go="homepage">Редактировать главную</button>
      </article>

      <article class="dash-card dash-card--wide">
        <p class="dash-eyebrow">Как работать клиенту</p>
        <ol class="dash-steps">
          <li>Измените товар, текст или контакты в нужной вкладке.</li>
          <li>Нажмите <strong>«Сохранить»</strong> в этой вкладке (или «Сохранить и на сайт» у товара).</li>
          <li>Нажмите <strong>«Опубликовать всё на сайт»</strong> — изменения появятся через 1–2 минуты.</li>
        </ol>
        <p class="hint">Скрытие товара и порядок в списке сохраняются в черновик; на сайт уйдут после публикации.</p>
      </article>
    </div>
  `;

  el.querySelector('#dash-publish-btn')?.addEventListener('click', () => {
    document.getElementById('publish-now-btn')?.click();
  });
  el.querySelector('[data-goto-publish]')?.addEventListener('click', () => {
    document.querySelector('.admin-nav-btn[data-tab="publish"]')?.click();
  });
  el.querySelectorAll('[data-tab-go]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelector(`.admin-nav-btn[data-tab="${btn.dataset.tabGo}"]`)?.click();
    });
  });
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
