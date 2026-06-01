import { getPageContent, SITE } from './data-store.js';

export function injectPageContent() {
  const pageId = document.body.dataset.page;
  if (!pageId) return;

  const page = getPageContent(pageId);
  if (!page) return;

  if (page.title) {
    document.title = `${page.title} — ${SITE.brand}`;
    const h1 = document.querySelector('.page-hero h1');
    if (h1) h1.textContent = page.title;
  }

  const container = document.querySelector('.page-content');
  if (container && page.html) container.innerHTML = page.html;
}
