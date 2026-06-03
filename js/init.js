import { getLoadError, loadSiteData } from './data-store.js';
import { initLayout } from './layout.js';
import { mountGlobalContacts, initHeaderScroll } from './manager.js';
import { mountFloatingUi } from './contact-fab.js';

function showLoadError(msg) {
  const el = document.createElement('div');
  el.className = 'site-load-error';
  el.setAttribute('role', 'alert');
  el.textContent = msg;
  document.body.prepend(el);
}

/** Загрузить JSON-контент и отрисовать шапку/подвал */
export async function boot(pageFn) {
  try {
    await loadSiteData();
  } catch (err) {
    console.error(err);
    showLoadError('Ошибка загрузки сайта. Попробуйте обновить страницу.');
    return;
  }
  const err = getLoadError();
  if (err) showLoadError(err);

  mountGlobalContacts();
  mountFloatingUi();
  initLayout();
  initHeaderScroll();
  if (pageFn) await pageFn();
}
