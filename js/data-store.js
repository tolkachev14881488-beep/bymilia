/** Загрузка контента сайта из data/*.json (редактируется в /admin/) */

import { dataFileUrl } from './site-path.js';

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
    features: ['Размер 25–42', 'Для зала и репетиций', 'Легко надевать самостоятельно'],
  },
];

const DEFAULT_PRODUCT_SPECS = {
  title: 'Основная информация',
  items: [
    { label: 'Состав', value: 'экокожа; флис; синтепон; Оксфорд' },
    { label: 'Материал подкладки обуви', value: 'флис' },
    { label: 'Материал стельки', value: 'ЭВА' },
    { label: 'Материал подошвы обуви', value: 'искусственная кожа' },
    { label: 'Вид застежки', value: 'резинка' },
    { label: 'Страна производства', value: 'Беларусь' },
    { label: 'Вес товара без упаковки (г)', value: '285 г' },
  ],
};

let siteData = structuredClone(DEFAULT_SITE);
let productsList = structuredClone(DEFAULT_PRODUCTS);
let productSpecs = structuredClone(DEFAULT_PRODUCT_SPECS);
let loadPromise = null;
let loadError = null;

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

async function fetchJson(url, { bustCache = false } = {}) {
  const fetchUrl = bustCache
    ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`
    : url;
  const res = await fetch(fetchUrl, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export function invalidateSiteDataCache() {
  loadPromise = null;
}

/** Применить данные после публикации из админки (без повторного fetch) */
export function applyCmsPayload(siteJson, productsJson) {
  if (siteJson) {
    siteData = deepMerge(DEFAULT_SITE, siteJson);
  }
  if (productsJson?.products) {
    productsList = productsJson.products;
  }
  if (productsJson?.productSpecs) {
    productSpecs = productsJson.productSpecs;
  }
  applyExports();
  return { siteData, products: productsList };
}

export async function loadSiteData({ reload = false } = {}) {
  if (reload) invalidateSiteDataCache();
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    loadError = null;
    const siteUrl = dataFileUrl('site.json');
    const productsUrl = dataFileUrl('products.json');
    const bust = reload;
    const [siteJson, productsJson] = await Promise.all([
      fetchJson(siteUrl, { bustCache: bust }),
      fetchJson(productsUrl, { bustCache: bust }),
    ]);
    if (!siteJson || !productsJson) {
      loadError = 'Не удалось загрузить данные сайта. Обновите страницу (Ctrl+F5).';
    }
    siteData = deepMerge(DEFAULT_SITE, siteJson || {});
    const list = productsJson?.products;
    productsList = Array.isArray(list) && list.length ? list : DEFAULT_PRODUCTS;
    if (productsJson?.productSpecs) {
      productSpecs = productsJson.productSpecs;
    } else {
      productSpecs = structuredClone(DEFAULT_PRODUCT_SPECS);
    }
    applyExports();
    return { siteData, products: productsList, error: loadError };
  })();
  return loadPromise;
}

export async function reloadSiteData() {
  return loadSiteData({ reload: true });
}

export function getLoadError() {
  return loadError;
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

const PRODUCT_ID_ALIASES = {
  black: 'wb-black',
  tropical: 'wb-tropical',
  bright: 'wb-bright',
  classic: 'wb-classic',
};

export function normalizeProductId(id) {
  if (!id) return id;
  return PRODUCT_ID_ALIASES[id] || id;
}

export function getProduct(id) {
  const norm = normalizeProductId(id);
  return productsList.find((p) => p.id === norm && p.published !== false);
}

export function sku(product, sizeId) {
  return `${product.skuPrefix}-${sizeId}`;
}

/** Для админки: полный каталог, включая скрытые */
export function getProductAny(id) {
  return productsList.find((p) => p.id === id);
}

export function getProductSpecs(product) {
  if (product?.specs?.items?.length) return product.specs;
  return productSpecs;
}

applyExports();
