import { loadSiteData } from './data-store.js';
import { initLayout } from './layout.js';
import { mountGlobalContacts } from './manager.js';

/** Скрыть шапку/полоску контактов до загрузки CSS (и при старом кэше) */
if (!document.getElementById('hide-top-chrome')) {
  const hideTop = document.createElement('style');
  hideTop.id = 'hide-top-chrome';
  hideTop.textContent =
    '#site-header,#contact-bar-slot,.contact-bar,.site-header{display:none!important}';
  document.head.appendChild(hideTop);
}

/** Загрузить JSON-контент и отрисовать шапку/подвал */
export async function boot(pageFn) {
  await loadSiteData();
  mountGlobalContacts();
  initLayout();
  if (pageFn) await pageFn();
}
