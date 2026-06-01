/** Загрузка контента сайта из data/*.json (редактируется в /admin/) */

const DEFAULT_SITE = {
  admin: { passwordHash: '689a18148c5a0cec342ba5ce0dfa5be545b00d0c0c66f0f85d9edddb20a522fc' },
  site: {
    brand: 'By Milia',
    tagline: 'Сапожки для разогрева стоп для танцев',
    currency: 'BYN',
    currencyLabel: 'руб.',
  },
  contacts: {
    phone: '+375 29 000-00-00',
    phoneRaw: '375290000000',
    email: 'orders@bymilia.by',
    whatsapp: '375290000000',
    instagram: 'https://instagram.com/',
    address: 'г. Минск, ул. Панченко, 8',
    pickupHours: '9:00–18:00, по предварительной договорённости',
    wildberries: 'https://www.wildberries.ru/',
  },
  delivery: {
    freePostFrom: 50,
    freeCourierMinskFrom: 150,
    sameDayBeforeHour: 13,
    wholesaleLeadDays: 14,
  },
  sizes: [
    { id: '25-27', label: '25–27' },
    { id: '28-30', label: '28–30' },
    { id: '31-33', label: '31–33' },
    { id: '34-36', label: '34–36' },
    { id: '37-39', label: '37–39' },
    { id: '40-42', label: '40–42' },
  ],
  deliveryOptions: [
    { id: 'pickup', label: 'Самовывоз (Минск, ул. Панченко, 8)', hint: 'Бесплатно' },
    { id: 'courier_minsk', label: 'Курьер по Минску', hint: 'Бесплатно от 150 руб.' },
    { id: 'europost', label: 'Почта / Европочта (Беларусь)', hint: 'Бесплатно от 50 руб.' },
    { id: 'cdek_rf', label: 'СДЭК (Россия)', hint: 'Стоимость по региону, уточнит менеджер' },
  ],
  homepage: {},
  pages: {},
};

const DEFAULT_PRODUCTS = [
  {
    id: 'black',
    colorName: 'Классический чёрный',
    colorHex: '#1c1c1c',
    price: 42,
    skuPrefix: 'BM-BLK',
    image: '',
    published: true,
    description: 'Сапожки для разогрева стоп перед занятиями и между номерами.',
    features: ['6 размеров', 'Для зала и репетиций', 'Легко надевать самостоятельно'],
  },
];

let siteData = structuredClone(DEFAULT_SITE);
let productsList = structuredClone(DEFAULT_PRODUCTS);
let loadPromise = null;

function dataUrl(file) {
  return new URL(`../data/${file}`, import.meta.url).href;
}

function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  const out = Array.isArray(target) ? [...target] : { ...target };
  for (const key of Object.keys(source)) {
    const val = source[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      out[key] = deepMerge(out[key] || {}, val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function loadSiteData() {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const [siteJson, productsJson] = await Promise.all([
      fetchJson(dataUrl('site.json')),
      fetchJson(dataUrl('products.json')),
    ]);
    siteData = deepMerge(DEFAULT_SITE, siteJson || {});
    const list = productsJson?.products;
    productsList = Array.isArray(list) && list.length ? list : DEFAULT_PRODUCTS;
    applyExports();
    return { siteData, products: productsList };
  })();
  return loadPromise;
}

export function getSiteData() {
  return siteData;
}

export function getProductsRaw() {
  return productsList;
}

export function getPublishedProducts() {
  return productsList.filter((p) => p.published !== false);
}

export function getPageContent(pageId) {
  return siteData.pages?.[pageId] || null;
}

export function getHomepage() {
  return siteData.homepage || {};
}

/* Экспортируемые поля (обновляются после loadSiteData) */
export let SITE = { ...DEFAULT_SITE.site };
export let CONTACTS = { ...DEFAULT_SITE.contacts };
export let DELIVERY = { ...DEFAULT_SITE.delivery };
export let SIZES = [...DEFAULT_SITE.sizes];
export let DELIVERY_OPTIONS = [...DEFAULT_SITE.deliveryOptions];
export let PRODUCTS = [...DEFAULT_PRODUCTS];

function applyExports() {
  SITE = { ...siteData.site };
  CONTACTS = { ...siteData.contacts };
  DELIVERY = { ...siteData.delivery };
  SIZES = [...(siteData.sizes || DEFAULT_SITE.sizes)];
  DELIVERY_OPTIONS = [...(siteData.deliveryOptions || DEFAULT_SITE.deliveryOptions)];
  PRODUCTS = getPublishedProducts();
}

export function getProduct(id) {
  return productsList.find((p) => p.id === id && p.published !== false);
}

export function sku(product, sizeId) {
  return `${product.skuPrefix}-${sizeId}`;
}

/** Для админки: полный каталог, включая скрытые */
export function getProductAny(id) {
  return productsList.find((p) => p.id === id);
}

applyExports();
