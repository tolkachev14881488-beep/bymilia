import { loadSiteData } from './data-store.js';
import { initLayout } from './layout.js';
import { initHeaderScroll, mountGlobalContacts } from './manager.js';

/** Загрузить JSON-контент и отрисовать шапку/подвал */
export async function boot(pageFn) {
  await loadSiteData();
  mountGlobalContacts();
  initLayout();
  initHeaderScroll();
  if (pageFn) await pageFn();
}
