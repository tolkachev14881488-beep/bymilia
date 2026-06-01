import { loadSiteData, getSiteData, getProductsRaw } from '../js/data-store.js';
import { loadGithubSettings, saveGithubSettings, publishToGithub } from './github-publish.js';

const AUTH_KEY = 'bymilia-admin-auth';
const DRAFT_KEY = 'bymilia-cms-draft';

let draft = null;
let editingProductId = null;

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function showAlert(message, type = 'info') {
  const box = document.getElementById('alert-box');
  box.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => {
    box.innerHTML = '';
  }, 6000);
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
  const stored = draft?.admin?.passwordHash || getSiteData().admin?.passwordHash;
  return hash === stored;
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
  const stored = loadDraftFromStorage();
  if (stored) draft = stored;
  else buildDraftFromServer();
  if (await verifyPassword(password)) {
    sessionStorage.setItem(AUTH_KEY, '1');
    showApp();
  } else {
    showAlert('Неверный пароль', 'err');
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem(AUTH_KEY);
  location.reload();
});

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  renderAll();
  loadPublishForm();
}

// ——— Tabs ———

const titles = {
  products: 'Товары',
  homepage: 'Главная',
  pages: 'Страницы',
  settings: 'Настройки',
  publish: 'Публикация',
};

document.querySelectorAll('.admin-nav-btn[data-tab]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.admin-nav-btn').forEach((b) => b.classList.toggle('is-active', b === btn));
    document.querySelectorAll('.admin-panel').forEach((p) => p.classList.toggle('is-active', p.dataset.panel === tab));
    document.getElementById('panel-title').textContent = titles[tab] || tab;
  });
});

document.getElementById('save-draft-btn').addEventListener('click', () => {
  collectActiveForms();
  saveDraftToStorage();
  showAlert('Черновик сохранён в браузере', 'ok');
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

function renderProductList() {
  const el = document.getElementById('product-list');
  el.innerHTML = draft.products
    .map(
      (p) => `
    <div class="product-row">
      <div>
        <strong>${esc(p.colorName)}</strong>
        <span class="product-row-meta">${esc(p.id)} · ${p.price} руб. ${p.published === false ? '· скрыт' : ''}</span>
      </div>
      <div>
        <button type="button" class="btn btn-secondary btn-sm" data-edit="${esc(p.id)}">Изменить</button>
        <button type="button" class="btn btn-danger btn-sm" data-del="${esc(p.id)}">Удалить</button>
      </div>
    </div>`,
    )
    .join('');

  el.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => openProductEditor(btn.dataset.edit));
  });
  el.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', () => deleteProduct(btn.dataset.del));
  });
}

function openProductEditor(id) {
  editingProductId = id;
  const p = draft.products.find((x) => x.id === id);
  if (!p) return;
  const box = document.getElementById('product-editor');
  box.classList.remove('hidden');
  box.innerHTML = `
    <h3>Редактирование: ${esc(p.colorName)}</h3>
    <div class="field-grid">
      <div class="field"><label>ID (латиница)</label><input name="id" value="${esc(p.id)}"></div>
      <div class="field"><label>Название</label><input name="colorName" value="${esc(p.colorName)}"></div>
      <div class="field"><label>Цвет (hex)</label><input name="colorHex" value="${esc(p.colorHex)}"></div>
      <div class="field"><label>Цена</label><input name="price" type="number" min="0" step="0.01" value="${p.price}"></div>
      <div class="field"><label>Артикул (префикс)</label><input name="skuPrefix" value="${esc(p.skuPrefix)}"></div>
      <div class="field"><label>Фото (URL)</label><input name="image" value="${esc(p.image || '')}" placeholder="https://… или assets/…"></div>
      <div class="field"><label>Показывать в каталоге</label>
        <select name="published"><option value="true" ${p.published !== false ? 'selected' : ''}>Да</option><option value="false" ${p.published === false ? 'selected' : ''}>Нет</option></select>
      </div>
    </div>
    <div class="field"><label>Описание</label><textarea name="description">${esc(p.description)}</textarea></div>
    <div class="field"><label>Особенности (по одной на строку)</label><textarea name="features">${esc((p.features || []).join('\n'))}</textarea></div>
    <button type="button" class="btn btn-primary btn-sm" id="save-product-btn">Сохранить товар</button>
    <button type="button" class="btn btn-secondary btn-sm" id="close-product-btn">Закрыть</button>
  `;
  box.querySelector('#save-product-btn').addEventListener('click', () => saveProductFromForm(p.id));
  box.querySelector('#close-product-btn').addEventListener('click', () => {
    box.classList.add('hidden');
    editingProductId = null;
  });
}

function saveProductFromForm(oldId) {
  const box = document.getElementById('product-editor');
  const get = (n) => box.querySelector(`[name="${n}"]`)?.value?.trim() ?? '';
  const idx = draft.products.findIndex((x) => x.id === oldId);
  if (idx < 0) return;
  const newId = get('id') || oldId;
  if (newId !== oldId && draft.products.some((x) => x.id === newId)) {
    showAlert('Такой ID уже есть', 'err');
    return;
  }
  draft.products[idx] = {
    id: newId,
    colorName: get('colorName'),
    colorHex: get('colorHex') || '#ff5500',
    price: parseFloat(get('price')) || 0,
    skuPrefix: get('skuPrefix'),
    image: get('image'),
    published: get('published') !== 'false',
    description: get('description'),
    features: get('features')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
  };
  saveDraftToStorage();
  renderProductList();
  showAlert('Товар сохранён в черновик', 'ok');
}

function deleteProduct(id) {
  if (!confirm('Удалить товар?')) return;
  draft.products = draft.products.filter((p) => p.id !== id);
  saveDraftToStorage();
  renderProductList();
  document.getElementById('product-editor').classList.add('hidden');
}

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
  renderProductList();
  openProductEditor(id);
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
  document.getElementById('hp-save').addEventListener('click', () => {
    collectHomepage();
    saveDraftToStorage();
    showAlert('Главная сохранена в черновик', 'ok');
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
  document.getElementById('pg-save').addEventListener('click', () => {
    collectPage();
    saveDraftToStorage();
    showAlert('Страница сохранена', 'ok');
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
    showAlert('Настройки сохранены', 'ok');
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
  const s = loadGithubSettings();
  document.getElementById('gh-owner').value = s.owner || 'tolkachev14881488-beep';
  document.getElementById('gh-repo').value = s.repo || 'bymilia';
  document.getElementById('gh-branch').value = s.branch || 'main';
  document.getElementById('gh-token').value = s.token || '';
}

document.getElementById('publish-github-btn').addEventListener('click', async () => {
  collectActiveForms();
  const token = document.getElementById('gh-token').value.trim();
  const owner = document.getElementById('gh-owner').value.trim();
  const repo = document.getElementById('gh-repo').value.trim();
  const branch = document.getElementById('gh-branch').value.trim() || 'main';
  if (!token || !owner || !repo) {
    showAlert('Укажите токен, владельца и репозиторий', 'err');
    return;
  }
  saveGithubSettings({ token, owner, repo, branch });
  try {
    showAlert('Публикация…', 'info');
    await publishToGithub({
      token,
      owner,
      repo,
      branch,
      siteJson: sitePayload(),
      productsJson: productsPayload(),
    });
    sessionStorage.removeItem(DRAFT_KEY);
    showAlert('Опубликовано! Сайт обновится через 1–3 минуты.', 'ok');
  } catch (e) {
    showAlert(`Ошибка: ${esc(e.message)}`, 'err');
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
  renderProductList();
  renderHomepageForm();
  renderPagesPanel();
  renderSettingsForm();
}

// ——— Boot ———

(async () => {
  if (sessionStorage.getItem(AUTH_KEY) === '1') {
    await loadSiteData();
    draft = loadDraftFromStorage() || null;
    if (!draft) buildDraftFromServer();
    showApp();
  }
})();
