import { loadSiteData } from './data-store.js';
import { initLayout } from './layout.js';

/** Загрузить JSON-контент и отрисовать шапку/подвал */
export async function boot(pageFn) {
  await loadSiteData();
  initLayout();
  if (pageFn) await pageFn();
}
