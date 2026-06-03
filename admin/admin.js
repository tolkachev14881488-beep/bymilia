import { loadSiteData, getSiteData, getProductsRaw } from '../js/data-store.js';
import { fetchWbCatalog, DEFAULT_WB_URLS } from '../js/wb.js';
import {
  getGithubConfig,
  isGithubConfigured,
  loadGithubSettings,
  downloadPublishPayload,
  isLocalPublishAvailable,
  publishSiteContent,
  saveGithubSettings,
  verifyGithubConnection,
  ensureDefaultPublishSettings,
} from './github-publish.js';

ensureDefaultPublishSettings();
import { initProductModeration } from './product-moderation.js';

const AUTH_KEY = 'bymilia-admin-auth';
const DRAFT_KEY = 'bymilia-cms-draft';

let draft = null;
let publishChain = Promise.resolve();
let publishUiState = 'idle';
let productModeration = null;

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function showAlert(message, type = 'info') {
  const box = document.getElementById('alert-box');
  const safe = esc(message).replace(/\n/g, '<br>');
  box.innerHTML = `<div class="alert alert-${type} alert--${type}">${safe}</div>`;
  const ms = type === 'err' ? 14000 : 6000;
  setTimeout(() => {
    box.innerHTML = '';
  }, ms);
}

function slugId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32) || `item-${Date.now()}`;
}

async function verifyPassword(password) {
  const hash = await sha256(password);
  const stored = getSiteData().admin?.passwordHash;
  return Boolean(stored && hash === stored);
}

function loadDraftFromStorage() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return null;
}

function saveDraftToStorage() {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function buildDraftFromServer() {
  const site = getSiteData();
  draft = {
    admin: { ...site.admin },
    site: { ...site.site },
    contacts: { ...site.contacts },
    delivery: { ...site.delivery },
    sizes: structuredClone(site.sizes),
    deliveryOptions: structuredClone(site.deliveryOptions),
    homepage: structuredClone(site.homepage || {}),
    pages: structuredClone(site.pages || {}),
    products: structuredClone(getProductsRaw()),
  };
  saveDraftToStorage();
}

function sitePayload() {
  const { products, ...site } = draft;
  return site;
}

function productsPayload() {
  return { products: draft.products };
}

// ——— Auth ———

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('password').value;
  await loadSiteData();
  if (await verifyPassword(password)) {
    sessionStorage.removeItem(DRAFT_KEY);
    sessionStorage.setItem(AUTH_KEY, '1');
    buildDraftFromServer();
    showApp();
  } else {
    sessionStorage.removeItem(DRAFT_KEY);
    showAlert('Неверный пароль. Сейчас: bymilia2026', 'err');
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem(AUTH_KEY);
  location.reload();
});

async function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  initProductModerationPanel();
  renderAll();
  loadPublishForm();
  await updateGithubBanner();
  const localOk = await isLocalPublishAvailable();
  setPublishUi(isGithubConfigured() || localOk ? 'idle' : 'err', localOk ? 'Локальная публикация' : '');
}

function initProductModerationPanel() {
  const listRoot = document.getElementById('product-moderation-list');
  const editorRoot = document.getElementById('product-moderation-editor');
  if (!listRoot || !editorRoot) return;

  productModeration = initProductModeration({
    root: listRoot,
    editorRoot,
    getProducts: () => draft.products,
    setProducts: (list) => {
      draft.products = list;
      saveDraftToStorage();
    },
    onSaveProduct: saveProductFromModeration,
    onQuickPublish: (msg) => queuePublish({ successMessage: msg }),
    onDelete: deleteProduct,
  });
}

async function saveProductFromModeration(oldId, data) {
  const uploads = data._pendingUploads || [];
  const { _pendingUploads, ...product } = data;
  const idx = draft.products.findIndex((x) => x.id === oldId);
  if (idx < 0) return;
  const newId = product.id || oldId;
  if (newId !== oldId && draft.products.some((x) => x.id === newId)) {
    showAlert('Такой ID уже есть', 'err');
    return;
  }
  const version = String(Number(draft.products[idx].imageVersion || 1) + 1);
  draft.products[idx] = { ...product, id: newId, imageVersion: version };
  saveDraftToStorage();
  const ok = await publishToSite({
    uploads,
    successMessage: uploads.length
      ? `Товар и ${uploads.length} фото опубликованы на сайте.`
      : 'Товар опубликован на сайте.',
  });
  if (ok) productModeration?.select(newId);
  else productModeration?.refresh();
}

// ——— Tabs ———

const titles = {
  products: 'Каталог',
  homepage: 'Главная',
  pages: 'Страницы',
  settings: 'Настройки',
  publish: 'Подключение',
};

function setPublishUi(state, detail = '') {
  publishUiState = state;
  const el = document.getElementById('publish-status');
  if (!el) return;
  const labels = {
    idle: isGithubConfigured() ? 'На сайте' : 'Нужен токен GitHub',
    publishing: 'Публикуем…',
    ok: 'Опубликовано',
    err: 'Ошибка публикации',
  };
  el.textContent = detail || labels[state] || state;
  el.dataset.state = state;
}

function readGithubForm() {
  return {
    token: document.getElementById('gh-token')?.value?.trim() || '',
    owner: document.getElementById('gh-owner')?.value?.trim() || '',
    repo: document.getElementById('gh-repo')?.value?.trim() || '',
    branch: document.getElementById('gh-branch')?.value?.trim() || 'main',
  };
}

function persistGithubForm() {
  saveGithubSettings(readGithubForm());
  updateGithubBanner();
  setPublishUi(isGithubConfigured() ? 'idle' : 'idle');
}

async function collectAllForms() {
  if (document.getElementById('hp-hero-title')) collectHomepage();
  if (document.getElementById('page-select')) collectPage();
  if (document.getElementById('st-brand')) await collectSettings();
}

async function publishToSite({ successMessage = 'Опубликовано.', uploads = [] } = {}) {
  await collectAllForms();
  persistGithubForm();
  const payload = { siteJson: sitePayload(), productsJson: productsPayload() };
  setPublishUi('publishing');
  try {
    const result = await publishSiteContent({
      siteJson: payload.siteJson,
      productsJson: payload.productsJson,
      uploads,
    });
    sessionStorage.removeItem(DRAFT_KEY);
    await loadSiteData();
    buildDraftFromServer();
    renderAll();
    setPublishUi('ok');
    const tail = result.mode === 'local' ? ' Сайт обновится за 1–2 минуты.' : ' Сайт обновится за 2–3 минуты.';
    showAlert(`${result.message || successMessage}${tail}`, 'ok');
    return true;
  } catch (e) {
    setPublishUi('err');
    downloadPublishPayload(payload);
    showAlert(
      `${esc(e.message)}<br><br>Скачан <code>cms-publish-payload.json</code>. Запустите на ПК: <code>node scripts/cms-publish-server.mjs</code> или <code>start-cms-publish.bat</code>, затем снова «Сохранить». Либо: <code>node scripts/cms-publish-from-payload.mjs</code> в папке загрузок.`,
      'err',
    );
    return false;
  }
}

function queuePublish(options) {
  publishChain = publishChain
    .then(() => publishToSite(options))
    .catch(() => {});
  return publishChain;
}

async function updateGithubBanner() {
  const el = document.getElementById('github-banner');
  if (!el) return;
  const local = await isLocalPublishAvailable();
  if (local) {
    el.classList.remove('hidden');
    el.className = 'github-banner github-banner--ok';
    el.innerHTML =
      'Локальная публикация активна (<code>cms-publish-server</code>). Сохранение в админке сразу пушит на GitHub.';
    return;
  }
  if (isGithubConfigured()) {
    el.classList.add('hidden');
    return;
  }
  el.classList.remove('hidden');
  el.className = 'github-banner';
  el.innerHTML =
    'Один раз: вкладка «Подключение» → вставьте GitHub-токен (scope <code>repo</code>) → «Проверить токен». ' +
    'Дальше каждое «Сохранить» публикует сайт автоматически. ' +
    'Или на ПК: <code>node scripts/cms-publish-server.mjs</code>.';
}

function showGithubConnected(info) {
  const el = document.getElementById('gh-connected');
  if (!el || !info) return;
  el.textContent = `GitHub: ${info.login} → ${info.repoFullName} (ветка ${info.defaultBranch || 'main'})`;
  el.classList.remove('hidden');
}

document.querySelectorAll('.admin-nav-btn[data-tab]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.admin-nav-btn').forEach((b) => b.classList.toggle('is-active', b === btn));
    document.querySelectorAll('.admin-panel').forEach((p) => p.classList.toggle('is-active', p.dataset.panel === tab));
    document.getElementById('panel-title').textContent = titles[tab] || tab;
  });
});

document.getElementById('publish-now-btn')?.addEventListener('click', () => {
  queuePublish({ successMessage: 'Весь контент опубликован на сайте.' });
});

document.querySelector('[data-goto-publish]')?.addEventListener('click', () => {
  document.querySelector('.admin-nav-btn[data-tab="publish"]')?.click();
});

document.getElementById('reload-btn').addEventListener('click', async () => {
  if (!confirm('Загрузить данные с сайта? Несохранённый черновик будет потерян.')) return;
  await loadSiteData();
  sessionStorage.removeItem(DRAFT_KEY);
  buildDraftFromServer();
  renderAll();
  showAlert('Данные обновлены с сервера', 'ok');
});

function collectActiveForms() {
  const panel = document.querySelector('.admin-panel.is-active')?.dataset.panel;
  if (panel === 'homepage') collectHomepage();
  if (panel === 'pages') collectPage();
  if (panel === 'settings') collectSettings();
}

// ——— Products ———

async function deleteProduct(id) {
  if (!confirm('Удалить товар?')) return;
  draft.products = draft.products.filter((p) => p.id !== id);
  saveDraftToStorage();
  productModeration?.refresh();
  await queuePublish({ successMessage: 'Товар удалён с сайта.' });
}

document.getElementById('wb-import-btn')?.addEventListener('click', async () => {
  const raw = document.getElementById('wb-urls')?.value ?? '';
  const urls = raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  try {
    showAlert('Загружаем данные с Wildberries…', 'info');
    draft.products = await fetchWbCatalog(urls.length ? urls : DEFAULT_WB_URLS);
    saveDraftToStorage();
    productModeration?.refresh();
    await queuePublish({ successMessage: `Импортировано ${draft.products.length} товаров и опубликовано на сайте.` });
  } catch (e) {
    showAlert(`Ошибка WB: ${esc(e.message)}`, 'err');
  }
});

document.getElementById('add-product-btn').addEventListener('click', () => {
  const id = `color-${Date.now()}`;
  draft.products.push({
    id,
    colorName: 'Новая расцветка',
    colorHex: '#ff5500',
    price: 42,
    skuPrefix: 'BM-NEW',
    image: '',
    published: true,
    description: '',
    features: ['6 размеров'],
  });
  saveDraftToStorage();
  productModeration?.refresh();
  productModeration?.select(id);
});

// ——— Homepage ———

function renderHomepageForm() {
  const hp = draft.homepage;
  const hero = hp.hero || {};
  const el = document.getElementById('homepage-form');
  el.innerHTML = `
    <h3>Hero</h3>
    <div class="field"><label>Плашка</label><input id="hp-hero-eyebrow" value="${esc(hero.eyebrow || '')}"></div>
    <div class="field"><label>Заголовок (HTML)</label><input id="hp-hero-title" value="${esc(hero.titleHtml || '')}"></div>
    <div class="field"><label>Текст</label><textarea id="hp-hero-lead">${esc(hero.lead || '')}</textarea></div>
    <div class="field"><label>Теги (по строке)</label><textarea id="hp-hero-tags">${esc((hero.tags || []).join('\n'))}</textarea></div>
    <div class="field-grid">
      <div class="field"><label>Подпись карточки</label><input id="hp-card-label" value="${esc(hero.cardLabel || '')}"></div>
      <div class="field"><label>Подзаголовок карточки</label><input id="hp-card-sub" value="${esc(hero.cardSub || '')}"></div>
    </div>
    <div class="field"><label>Бегущая строка (слова)</label><input id="hp-marquee" value="${esc((hp.marquee || []).join(', '))}"></div>
    <h3>Bento-блоки</h3>
    <div class="bento-editor" id="hp-bento"></div>
    <button type="button" class="btn btn-secondary btn-sm" id="hp-add-bento">+ Блок</button>
    <h3>Шаги заказа</h3>
    <div class="field-grid">
      <div class="field"><label>Плашка</label><input id="hp-steps-eyebrow" value="${esc(hp.steps?.eyebrow || '')}"></div>
      <div class="field"><label>Заголовок</label><input id="hp-steps-title" value="${esc(hp.steps?.title || '')}"></div>
    </div>
    <div class="field"><label>Описание</label><input id="hp-steps-lead" value="${esc(hp.steps?.lead || '')}"></div>
    <div class="step-editor" id="hp-steps"></div>
    <button type="button" class="btn btn-secondary btn-sm" id="hp-add-step">+ Шаг</button>
    <h3>Каталог на главной</h3>
    <div class="field-grid">
      <div class="field"><label>Плашка</label><input id="hp-cat-eyebrow" value="${esc(hp.catalogSection?.eyebrow || '')}"></div>
      <div class="field"><label>Заголовок</label><input id="hp-cat-title" value="${esc(hp.catalogSection?.title || '')}"></div>
    </div>
    <div class="field"><label>Текст</label><textarea id="hp-cat-lead">${esc(hp.catalogSection?.lead || '')}</textarea></div>
    <h3>Преимущества</h3>
    <div class="field-grid">
      <div class="field"><label>Плашка</label><input id="hp-ben-eyebrow" value="${esc(hp.benefits?.eyebrow || '')}"></div>
      <div class="field"><label>Заголовок</label><input id="hp-ben-title" value="${esc(hp.benefits?.title || '')}"></div>
    </div>
    <div class="field"><label>Текст</label><textarea id="hp-ben-lead">${esc(hp.benefits?.lead || '')}</textarea></div>
    <div id="hp-ben-cards"></div>
    <button type="button" class="btn btn-secondary btn-sm" id="hp-add-ben">+ Карточка</button>
    <h3>CTA</h3>
    <div class="field"><label>Заголовок</label><input id="hp-cta-title" value="${esc(hp.cta?.title || '')}"></div>
    <div class="field"><label>Текст</label><textarea id="hp-cta-text">${esc(hp.cta?.text || '')}</textarea></div>
    <button type="button" class="btn btn-primary btn-sm" id="hp-save">Сохранить главную</button>
  `;

  renderBentoEditor();
  renderStepsEditor();
  renderBenefitCards();

  document.getElementById('hp-add-bento').addEventListener('click', () => {
    hp.bento = hp.bento || [];
    hp.bento.push({ num: '0', title: '', text: '', variant: 'small' });
    renderBentoEditor();
  });
  document.getElementById('hp-add-step').addEventListener('click', () => {
    hp.steps = hp.steps || { items: [] };
    hp.steps.items = hp.steps.items || [];
    hp.steps.items.push({ title: '', text: '' });
    renderStepsEditor();
  });
  document.getElementById('hp-add-ben').addEventListener('click', () => {
    hp.benefits = hp.benefits || { cards: [] };
    hp.benefits.cards = hp.benefits.cards || [];
    hp.benefits.cards.push({ icon: '✦', title: '', text: '' });
    renderBenefitCards();
  });
  document.getElementById('hp-save').addEventListener('click', async () => {
    collectHomepage();
    saveDraftToStorage();
    await queuePublish({ successMessage: 'Главная опубликована на сайте.' });
  });
}

function renderBentoEditor() {
  const hp = draft.homepage;
  const wrap = document.getElementById('hp-bento');
  if (!wrap) return;
  wrap.innerHTML = (hp.bento || [])
    .map(
      (b, i) => `
    <div class="bento-item" data-i="${i}">
      <div class="field-grid">
        <div class="field"><label>№</label><input data-f="num" value="${esc(b.num)}"></div>
        <div class="field"><label>Тип</label>
          <select data-f="variant">
            ${['large', 'tall', 'accent', 'small', 'wide'].map((v) => `<option value="${v}" ${b.variant === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field"><label>Заголовок</label><input data-f="title" value="${esc(b.title)}"></div>
      <div class="field"><label>Текст</label><textarea data-f="text">${esc(b.text)}</textarea></div>
      <button type="button" class="btn btn-danger btn-sm" data-rm-bento="${i}">Удалить</button>
    </div>`,
    )
    .join('');
  wrap.querySelectorAll('[data-rm-bento]').forEach((btn) => {
    btn.addEventListener('click', () => {
      hp.bento.splice(Number(btn.dataset.rmBento), 1);
      renderBentoEditor();
    });
  });
  wrap.querySelectorAll('.bento-item').forEach((item) => {
    const i = Number(item.dataset.i);
    item.querySelectorAll('[data-f]').forEach((input) => {
      input.addEventListener('input', () => {
        hp.bento[i][input.dataset.f] = input.value;
      });
    });
  });
}

function renderStepsEditor() {
  const items = draft.homepage.steps?.items || [];
  const wrap = document.getElementById('hp-steps');
  if (!wrap) return;
  wrap.innerHTML = items
    .map(
      (s, i) => `
    <div class="step-item" data-i="${i}">
      <div class="field"><label>Заголовок</label><input data-f="title" value="${esc(s.title)}"></div>
      <div class="field"><label>Текст</label><input data-f="text" value="${esc(s.text)}"></div>
      <button type="button" class="btn btn-danger btn-sm" data-rm-step="${i}">Удалить</button>
    </div>`,
    )
    .join('');
  wrap.querySelectorAll('[data-rm-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      draft.homepage.steps.items.splice(Number(btn.dataset.rmStep), 1);
      renderStepsEditor();
    });
  });
  wrap.querySelectorAll('.step-item').forEach((item) => {
    const i = Number(item.dataset.i);
    item.querySelectorAll('[data-f]').forEach((input) => {
      input.addEventListener('input', () => {
        draft.homepage.steps.items[i][input.dataset.f] = input.value;
      });
    });
  });
}

function renderBenefitCards() {
  const cards = draft.homepage.benefits?.cards || [];
  const wrap = document.getElementById('hp-ben-cards');
  if (!wrap) return;
  wrap.innerHTML = cards
    .map(
      (c, i) => `
    <div class="bento-item" data-i="${i}">
      <div class="field-grid">
        <div class="field"><label>Иконка</label><input data-f="icon" value="${esc(c.icon)}"></div>
        <div class="field"><label>Заголовок</label><input data-f="title" value="${esc(c.title)}"></div>
      </div>
      <div class="field"><label>Текст</label><textarea data-f="text">${esc(c.text)}</textarea></div>
      <button type="button" class="btn btn-danger btn-sm" data-rm-ben="${i}">Удалить</button>
    </div>`,
    )
    .join('');
  wrap.querySelectorAll('[data-rm-ben]').forEach((btn) => {
    btn.addEventListener('click', () => {
      draft.homepage.benefits.cards.splice(Number(btn.dataset.rmBen), 1);
      renderBenefitCards();
    });
  });
  wrap.querySelectorAll('[data-i]').forEach((item) => {
    const i = Number(item.dataset.i);
    item.querySelectorAll('[data-f]').forEach((input) => {
      input.addEventListener('input', () => {
        draft.homepage.benefits.cards[i][input.dataset.f] = input.value;
      });
    });
  });
}

function collectHomepage() {
  const hp = draft.homepage;
  hp.hero = {
    eyebrow: val('hp-hero-eyebrow'),
    titleHtml: val('hp-hero-title'),
    lead: val('hp-hero-lead'),
    tags: val('hp-hero-tags')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    cardLabel: val('hp-card-label'),
    cardSub: val('hp-card-sub'),
  };
  hp.marquee = val('hp-marquee')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  hp.steps = {
    eyebrow: val('hp-steps-eyebrow'),
    title: val('hp-steps-title'),
    lead: val('hp-steps-lead'),
    items: hp.steps?.items || [],
  };
  hp.catalogSection = {
    eyebrow: val('hp-cat-eyebrow'),
    title: val('hp-cat-title'),
    lead: val('hp-cat-lead'),
  };
  hp.benefits = {
    eyebrow: val('hp-ben-eyebrow'),
    title: val('hp-ben-title'),
    lead: val('hp-ben-lead'),
    cards: hp.benefits?.cards || [],
  };
  hp.cta = { title: val('hp-cta-title'), text: val('hp-cta-text') };
  document.querySelectorAll('#hp-bento .bento-item').forEach((item, i) => {
    if (!hp.bento[i]) return;
    item.querySelectorAll('[data-f]').forEach((input) => {
      hp.bento[i][input.dataset.f] = input.value;
    });
  });
}

function val(id) {
  return document.getElementById(id)?.value ?? '';
}

// ——— Pages ———

function renderPagesPanel() {
  const select = document.getElementById('page-select');
  const ids = Object.keys(draft.pages || {});
  select.innerHTML = ids.map((id) => `<option value="${id}">${id}</option>`).join('');
  select.onchange = () => renderPageForm(select.value);
  renderPageForm(select.value || ids[0]);
}

function renderPageForm(pageId) {
  const page = draft.pages[pageId];
  const el = document.getElementById('page-form');
  if (!page) {
    el.innerHTML = '<p>Страница не найдена</p>';
    return;
  }
  el.innerHTML = `
    <div class="field"><label>Заголовок</label><input id="pg-title" value="${esc(page.title)}"></div>
    <div class="field"><label>HTML-контент</label><textarea id="pg-html" style="min-height:280px">${esc(page.html)}</textarea></div>
    <button type="button" class="btn btn-primary btn-sm" id="pg-save">Сохранить страницу</button>
  `;
  document.getElementById('pg-save').addEventListener('click', async () => {
    collectPage();
    saveDraftToStorage();
    await queuePublish({ successMessage: 'Страница опубликована на сайте.' });
  });
}

function collectPage() {
  const id = document.getElementById('page-select').value;
  if (!draft.pages[id]) return;
  draft.pages[id] = {
    title: document.getElementById('pg-title')?.value ?? '',
    html: document.getElementById('pg-html')?.value ?? '',
  };
}

// ——— Settings ———

function renderSettingsForm() {
  const c = draft.contacts;
  const d = draft.delivery;
  const el = document.getElementById('settings-form');
  el.innerHTML = `
    <h3>Бренд</h3>
    <div class="field-grid">
      <div class="field"><label>Название</label><input id="st-brand" value="${esc(draft.site.brand)}"></div>
      <div class="field"><label>Слоган</label><input id="st-tagline" value="${esc(draft.site.tagline)}"></div>
    </div>
    <h3>Контакты</h3>
    <div class="field-grid">
      <div class="field"><label>Телефон</label><input id="st-phone" value="${esc(c.phone)}"></div>
      <div class="field"><label>Телефон (цифры)</label><input id="st-phoneRaw" value="${esc(c.phoneRaw)}"></div>
      <div class="field"><label>Email</label><input id="st-email" value="${esc(c.email)}"></div>
      <div class="field"><label>WhatsApp</label><input id="st-whatsapp" value="${esc(c.whatsapp)}"></div>
      <div class="field"><label>Instagram</label><input id="st-instagram" value="${esc(c.instagram)}"></div>
      <div class="field"><label>Адрес</label><input id="st-address" value="${esc(c.address)}"></div>
      <div class="field"><label>Wildberries</label><input id="st-wb" value="${esc(c.wildberries)}"></div>
    </div>
    <h3>Доставка</h3>
    <div class="field-grid">
      <div class="field"><label>Бесплатная почта от (руб.)</label><input id="st-post" type="number" value="${d.freePostFrom}"></div>
      <div class="field"><label>Курьер Минск от (руб.)</label><input id="st-courier" type="number" value="${d.freeCourierMinskFrom}"></div>
      <div class="field"><label>Отправка в день до (час)</label><input id="st-hour" type="number" value="${d.sameDayBeforeHour}"></div>
    </div>
    <h3>Пароль админки</h3>
    <div class="field"><label>Новый пароль</label><input id="st-new-pass" type="password" placeholder="Оставьте пустым, если не менять"></div>
    <button type="button" class="btn btn-primary btn-sm" id="st-save">Сохранить настройки</button>
  `;
  document.getElementById('st-save').addEventListener('click', async () => {
    await collectSettings();
    saveDraftToStorage();
    await queuePublish({ successMessage: 'Настройки опубликованы на сайте.' });
  });
}

async function collectSettings() {
  draft.site.brand = document.getElementById('st-brand')?.value ?? draft.site.brand;
  draft.site.tagline = document.getElementById('st-tagline')?.value ?? draft.site.tagline;
  draft.contacts = {
    phone: val('st-phone'),
    phoneRaw: val('st-phoneRaw'),
    email: val('st-email'),
    whatsapp: val('st-whatsapp'),
    instagram: val('st-instagram'),
    address: val('st-address'),
    pickupHours: draft.contacts.pickupHours,
    wildberries: val('st-wb'),
  };
  draft.delivery = {
    freePostFrom: Number(val('st-post')) || 50,
    freeCourierMinskFrom: Number(val('st-courier')) || 150,
    sameDayBeforeHour: Number(val('st-hour')) || 13,
    wholesaleLeadDays: draft.delivery.wholesaleLeadDays,
  };
  const newPass = document.getElementById('st-new-pass')?.value;
  if (newPass) {
    draft.admin.passwordHash = await sha256(newPass);
  }
}

// ——— Publish ———

function loadPublishForm() {
  ensureDefaultPublishSettings();
  const s = loadGithubSettings();
  document.getElementById('gh-owner').value = s.owner || 'tolkachev14881488-beep';
  document.getElementById('gh-repo').value = s.repo || 'bymilia';
  document.getElementById('gh-branch').value = s.branch || 'main';
  document.getElementById('gh-token').value = s.token || '';
}

['gh-token', 'gh-owner', 'gh-repo', 'gh-branch'].forEach((id) => {
  document.getElementById(id)?.addEventListener('change', persistGithubForm);
});

document.getElementById('check-token-btn')?.addEventListener('click', async () => {
  persistGithubForm();
  const cfg = readGithubForm();
  if (!cfg.token) {
    showAlert('Вставьте токен', 'err');
    return;
  }
  try {
    setPublishUi('publishing');
    const info = await verifyGithubConnection(cfg);
    showGithubConnected(info);
    setPublishUi('ok', `OK: ${info.login}`);
    showAlert(`Токен подходит. Аккаунт: ${info.login}, репозиторий: ${info.repoFullName}`, 'ok');
  } catch (e) {
    setPublishUi('err');
    showAlert(e.message, 'err');
  }
});

document.getElementById('test-github-btn')?.addEventListener('click', async () => {
  persistGithubForm();
  const cfg = readGithubForm();
  if (!cfg.token || !cfg.owner || !cfg.repo) {
    showAlert('Заполните токен, владельца и репозиторий', 'err');
    return;
  }
  try {
    setPublishUi('publishing');
    const info = await verifyGithubConnection(cfg);
    showGithubConnected(info);
    await queuePublish({ successMessage: `Опубликовано (${info.login}). Сайт обновится за 1–2 мин.` });
  } catch (e) {
    setPublishUi('err');
    showAlert(e.message, 'err');
  }
});

document.getElementById('download-json-btn').addEventListener('click', () => {
  collectActiveForms();
  downloadJson('site.json', sitePayload());
  downloadJson('products.json', productsPayload());
  showAlert('Файлы скачаны — положите в папку data/ и запушьте в GitHub', 'ok');
});

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderAll() {
  productModeration?.refresh();
  renderHomepageForm();
  renderPagesPanel();
  renderSettingsForm();
}

function applySetupFromHash() {
  const raw = location.hash.replace(/^#/, '');
  if (!raw) return;
  const params = new URLSearchParams(raw);
  const gh = params.get('gh_token') || params.get('gh');
  const cms = params.get('cms_key') || params.get('cms');
  if (!gh && !cms) return;
  saveGithubSettings({
    ...(gh ? { token: gh } : {}),
    ...(cms ? { cmsPublishKey: cms } : {}),
    owner: 'tolkachev14881488-beep',
    repo: 'bymilia',
    branch: 'main',
  });
  if (gh && cms) {
    sessionStorage.setItem(AUTH_KEY, '1');
    sessionStorage.removeItem(DRAFT_KEY);
  }
  history.replaceState(null, '', location.pathname + location.search);
}

// ——— Boot ———

applySetupFromHash();

(async () => {
  if (sessionStorage.getItem(AUTH_KEY) === '1') {
    await loadSiteData();
    sessionStorage.removeItem(DRAFT_KEY);
    buildDraftFromServer();
    showApp();
    return;
  }
})();
