import { CONTACTS, SITE } from './config.js';
import { getPageContent } from './data-store.js';
import { renderManagerCard } from './manager.js';
import { applySeo, breadcrumbJsonLd, injectJsonLd, pageUrl } from './seo.js';

const PAGE_PATHS = {
  about: 'pages/about.html',
  delivery: 'pages/delivery.html',
  wholesale: 'pages/wholesale.html',
  production: 'pages/production.html',
  contacts: 'pages/contacts.html',
  faq: 'pages/faq.html',
  guarantee: 'pages/guarantee.html',
  'where-to-buy': 'pages/where-to-buy.html',
  news: 'pages/news.html',
  offer: 'pages/offer.html',
  privacy: 'pages/privacy.html',
};

export function injectPageContent() {
  const pageId = document.body.dataset.page;
  if (!pageId) return;

  const page = getPageContent(pageId);
  if (!page) return;

  const metaTitle = page.metaTitle || `${page.title} — ${SITE.brand}`;
  const metaDesc =
    page.metaDescription ||
    `${page.title}. ${SITE.brand} — сапожки для разогрева стоп, производство в Минске. Заказ на сайте, связь с менеджером.`;

  applySeo({
    title: metaTitle,
    description: metaDesc,
    path: PAGE_PATHS[pageId] || `pages/${pageId}.html`,
  });

  if (page.title) {
    const h1 = document.querySelector('.page-hero h1');
    if (h1) h1.textContent = page.title;
    const lead = document.querySelector('.page-hero .lead');
    if (lead) {
      const leadText = (page.lead || '').trim();
      if (leadText) {
        lead.textContent = leadText;
        lead.hidden = false;
      } else {
        lead.textContent = '';
        lead.hidden = true;
      }
    }
  }

  const container = document.querySelector('.page-content');
  if (container && page.html) {
    container.innerHTML = page.html + renderManagerCard(page.managerCard);
  } else if (container) {
    container.insertAdjacentHTML('beforeend', renderManagerCard(page.managerCard));
  }

  breadcrumbJsonLd([
    { name: 'Главная', path: 'index.html' },
    { name: page.title, path: PAGE_PATHS[pageId] || '' },
  ]);

  if (pageId === 'contacts') {
    injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: SITE.brand,
      url: pageUrl(''),
      telephone: `+${CONTACTS.phoneRaw}`,
      email: CONTACTS.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: CONTACTS.address,
        addressLocality: 'Минск',
        addressCountry: 'BY',
      },
    });
  }
}
