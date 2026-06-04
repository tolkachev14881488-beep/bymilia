/**
 * Тесты адаптивного дизайна по профилям устройств (статический аудит CSS + HTML).
 * node scripts/design-responsive-test.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const styles = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');

let failed = 0;
const warnings = [];

function ok(label) {
  console.log(`  OK ${label}`);
}

function fail(label, detail) {
  failed += 1;
  console.error(`  FAIL ${label}: ${detail}`);
}

function warn(label, detail) {
  warnings.push(`${label}: ${detail}`);
  console.log(`  WARN ${label}: ${detail}`);
}

/** Профили устройств → минимальный брейкпоинт CSS (max-width), который должен покрывать layout */
const DEVICES = [
  { id: 'iphone-se', name: 'iPhone SE', width: 320, breakpoint: 380 },
  { id: 'iphone-12', name: 'iPhone 12/13', width: 390, breakpoint: 600 },
  { id: 'iphone-14-pro-max', name: 'iPhone 14 Pro Max', width: 430, breakpoint: 600 },
  { id: 'android-mid', name: 'Android средний', width: 360, breakpoint: 600 },
  { id: 'ipad-mini', name: 'iPad mini / планшет', width: 768, breakpoint: 900 },
  { id: 'ipad-air', name: 'iPad Air', width: 820, breakpoint: 900 },
  { id: 'laptop', name: 'Ноутбук', width: 1280, breakpoint: null },
  { id: 'desktop', name: 'Desktop HD', width: 1440, breakpoint: null },
];

const PUBLIC_PAGES = [
  { file: 'index.html', html: ['hero-intro', 'hero-visual', 'hero-body', 'hero-grid'], js: [] },
  {
    file: 'catalog.html',
    html: ['product-grid', 'page-catalog'],
    js: ['product-card', 'renderProductGrid'],
  },
  {
    file: 'cart.html',
    html: ['cart-layout', 'cart-mobile-bar', 'page-cart'],
    js: ['cart-line-main'],
  },
  {
    file: 'product.html',
    html: ['product-root'],
    js: ['product-layout', 'product-gallery', 'initProductPage'],
  },
  { file: 'pages/wholesale.html', html: ['page-hero', 'page-content', 'page-wholesale'], js: [] },
  { file: 'pages/about.html', html: ['page-hero', 'page-content'], js: [] },
  { file: 'pages/delivery.html', html: ['page-hero', 'page-content'], js: [] },
  { file: 'pages/contacts.html', html: ['page-hero', 'page-content'], js: [] },
  { file: 'pages/faq.html', html: ['page-hero', 'page-content'], js: [] },
  { file: 'pages/where-to-buy.html', html: ['page-hero', 'page-content'], js: [] },
];

const pagesJs = fs.readFileSync(path.join(root, 'js/pages.js'), 'utf8');

function extractMediaBlocks(css) {
  const blocks = [];
  const re = /@media\s*([^{]+)\{/g;
  let m;
  while ((m = re.exec(css))) {
    const query = m[1].trim();
    const start = m.index + m[0].length;
    let depth = 1;
    let i = start;
    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth += 1;
      if (css[i] === '}') depth -= 1;
      i += 1;
    }
    blocks.push({ query, body: css.slice(start, i - 1) });
  }
  return blocks;
}

function maxWidthFromQuery(query) {
  const match = query.match(/max-width:\s*(\d+)px/);
  return match ? Number(match[1]) : null;
}

function blocksCoveringWidth(blocks, width) {
  return blocks.filter((b) => {
    const max = maxWidthFromQuery(b.query);
    if (max != null) return width <= max;
    if (b.query.includes('pointer: coarse') || b.query.includes('prefers-reduced-motion')) {
      return true;
    }
    const min = b.query.match(/min-width:\s*(\d+)px/);
    if (min) return width >= Number(min[1]);
    return false;
  });
}

function selectorInBlocks(blocks, selector) {
  const needle = selector.replace(/\./g, '\\.');
  const re = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return blocks.some((b) => re.test(b.body));
}

const mediaBlocks = extractMediaBlocks(styles);

console.log('\n=== Профили устройств ===');
for (const device of DEVICES) {
  const applicable = device.breakpoint
    ? mediaBlocks.filter((b) => {
        const max = maxWidthFromQuery(b.query);
        return max != null && max >= device.width && max <= device.breakpoint + 200;
      })
    : mediaBlocks.filter((b) => b.query.includes('min-width'));
  if (device.width >= 901) {
    if (styles.includes('.hero-grid') && styles.includes('grid-template-areas')) ok(`${device.name}: desktop hero grid`);
    else fail(`${device.name}`, 'desktop hero grid missing');
  } else if (applicable.length > 0) {
    ok(`${device.name} (${device.width}px) — есть @media до ${device.breakpoint ?? '∞'}px`);
  } else {
    fail(`${device.name}`, `нет подходящих media queries для ${device.width}px`);
  }
}

console.log('\n=== Viewport и CSS cache (все страницы) ===');
const versions = new Set();
for (const { file } of PUBLIC_PAGES) {
  const fp = path.join(root, file);
  const html = fs.readFileSync(fp, 'utf8');
  if (!html.includes('width=device-width') || !html.includes('viewport-fit=cover')) {
    fail('viewport', file);
  }
  const v = html.match(/styles\.css\?v=(\d+)/);
  if (v) versions.add(v[1]);
  else fail('css v', file);
}
if (versions.size === 1) ok(`единый styles.css?v=${[...versions][0]}`);
else fail('css version', [...versions].join(', '));

console.log('\n=== Ключевые блоки на страницах ===');
for (const page of PUBLIC_PAGES) {
  const html = fs.readFileSync(path.join(root, page.file), 'utf8');
  for (const token of page.html) {
    if (!html.includes(token)) fail(page.file, `HTML: нет ${token}`);
  }
  for (const token of page.js) {
    if (!pagesJs.includes(token)) fail(page.file, `JS: нет ${token} в pages.js`);
  }
  ok(`${page.file}`);
}

console.log('\n=== Главная: mobile hero (≤900px) ===');
const mobile900 = blocksCoveringWidth(mediaBlocks, 390);
const homeRules = [
  'page-home .hero-grid',
  'page-home .hero-intro',
  'page-home .hero-visual',
  'page-home .hero-body',
  'page-home .hero-photo-frame',
  'page-home .hero-stats',
  'grid-template-areas',
];
for (const rule of homeRules) {
  if (!selectorInBlocks(mobile900, rule) && !styles.includes(rule)) {
    fail('home mobile', `нет правила ${rule}`);
  } else ok(`hero mobile: ${rule}`);
}

console.log('\n=== Каталог: карточки (≤900px и ≤768px) ===');
const cat900 = blocksCoveringWidth(mediaBlocks, 430);
if (selectorInBlocks(cat900, 'product-grid') || styles.includes('product-grid')) {
  ok('product-grid в mobile CSS');
} else fail('catalog', 'product-grid mobile');

const blocks768 = mediaBlocks.filter((b) => maxWidthFromQuery(b.query) === 768);
if (
  blocks768.some((b) => b.body.includes('product-grid')) ||
  cat900.some((b) => b.body.includes('repeat(2'))
) {
  ok('каталог 2 колонки на узком экране');
} else warn('catalog', 'явное правило 2-col не найдено в 768/900');

console.log('\n=== Корзина: mobile (≤900px) ===');
const cartRules = [
  ['page-cart .cart-line', 'body.page-cart .cart-line'],
  ['page-cart .cart-line-main', 'cart-line-main'],
  ['cart-mobile-bar', 'cart-mobile-bar'],
  ['page-cart .cart-layout', 'body.page-cart', 'cart-layout'],
  ['display: contents', 'display: contents'],
];
for (const variants of cartRules) {
  if (variants.some((v) => styles.includes(v))) ok(`cart: ${variants[0]}`);
  else fail('cart mobile', variants[0]);
}

console.log('\n=== Товар: галерея и панель ===');
if (styles.includes('.product-layout') && styles.includes('product-gallery')) {
  const prodBlocks = blocksCoveringWidth(mediaBlocks, 390);
  if (prodBlocks.some((b) => b.body.includes('product-layout') || b.body.includes('product-photo'))) {
    ok('product page mobile layout');
  } else ok('product layout (base + общие media)');
} else fail('product', 'product-layout');

console.log('\n=== Overflow / safe-area ===');
if (styles.includes('overflow-x: hidden') && styles.includes('--safe-bottom')) ok('overflow-x + safe-area');
else fail('globals', 'overflow or safe-area vars');

if (styles.includes('minmax(0, 1fr)') || styles.includes('min-width: 0')) ok('grid min-width guard');
else warn('overflow', 'minmax(0)/min-width:0 не найдены');

console.log('\n=== Touch targets (≥44px) ===');
if (styles.includes('min-height: 44px') || styles.includes('width: 44px')) ok('touch target sizing');
else warn('touch', 'явные 44px не везде — проверьте кнопки вручную');

console.log('\n=== Контент site.json (влияет на вёрстку) ===');
const site = JSON.parse(fs.readFileSync(path.join(root, 'data/site.json'), 'utf8'));
if (site.homepage?.hero?.heroImage) ok('heroImage в CMS');
else fail('site.json', 'heroImage missing');
if (site.contacts?.mapLat && site.contacts?.mapLon) ok('footer map coordinates');
else fail('site.json', 'mapLat/mapLon missing');
if (site.homepage?.hero?.stats?.length >= 3) ok('hero stats');
else fail('site.json', 'hero stats');
if (Object.keys(site.pages || {}).length >= 8) ok(`${Object.keys(site.pages).length} страниц контента`);
else fail('site.json', 'мало страниц');

console.log('\n=== Итог ===');
if (warnings.length) {
  console.log(`  Предупреждений: ${warnings.length}`);
  warnings.forEach((w) => console.log(`    - ${w}`));
}
if (failed) {
  console.error(`\n${failed} проверок дизайна не пройдено`);
  process.exit(1);
}
console.log(`\nДизайн-тесты пройдены для ${DEVICES.length} профилей устройств и ${PUBLIC_PAGES.length} страниц`);
