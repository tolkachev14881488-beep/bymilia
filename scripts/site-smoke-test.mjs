/**
 * Smoke-тест логики сайта (Node): JSON, корзина, сообщения заказа.
 * Запуск: node scripts/site-smoke-test.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function ok(label) {
  console.log(`  OK ${label}`);
}

function fail(label, detail) {
  failed += 1;
  console.error(`  FAIL ${label}: ${detail}`);
}

const site = JSON.parse(fs.readFileSync(path.join(root, 'data/site.json'), 'utf8'));
const products = JSON.parse(fs.readFileSync(path.join(root, 'data/products.json'), 'utf8'));

if (!site.site?.brand) fail('site.json', 'missing brand');
else ok('site.json');

const list = products.products || [];
if (list.length < 1) fail('products.json', 'empty products');
else ok(`products.json (${list.length} items)`);

const ids = new Set(list.map((p) => p.id));
for (const id of ['wb-black', 'wb-tropical', 'wb-bright', 'wb-classic']) {
  if (!ids.has(id)) fail('product ids', `missing ${id}`);
}
ok('product ids wb-*');

const ALIASES = { black: 'wb-black', tropical: 'wb-tropical', bright: 'wb-bright', classic: 'wb-classic' };
function normalizeProductId(id) {
  return ALIASES[id] || id;
}
function getProduct(id) {
  const norm = normalizeProductId(id);
  return list.find((p) => p.id === norm && p.published !== false);
}

const cart = [{ key: 'black:25-27', productId: 'black', sizeId: '25-27', qty: 2 }];
const migrated = cart.map((line) => {
  const productId = normalizeProductId(line.productId);
  return { ...line, productId, key: `${productId}:${line.sizeId}` };
});
if (migrated[0].productId !== 'wb-black') fail('cart migrate', migrated[0].productId);
else ok('cart id migration black→wb-black');

if (!getProduct('wb-black')) fail('getProduct', 'wb-black');
else ok('getProduct');

const msgLines = migrated
  .map((line) => {
    const p = getProduct(line.productId);
    if (!p) return '';
    return `• ${p.colorName} — ${line.qty}`;
  })
  .filter(Boolean);
if (!msgLines.length) fail('order message', 'empty');
else ok('order message build');

const htmlPages = [
  'index.html',
  'catalog.html',
  'cart.html',
  'product.html',
  'pages/wholesale.html',
  'pages/about.html',
];
for (const p of htmlPages) {
  const fp = path.join(root, p);
  if (!fs.existsSync(fp)) fail('html', `missing ${p}`);
  else {
    const html = fs.readFileSync(fp, 'utf8');
    if (!html.includes('site-header') && !html.includes('init.js'))
      fail('html', `${p} no boot`);
    else ok(`html ${p}`);
  }
}

console.log(failed ? `\n${failed} failed` : '\nAll smoke checks passed');
process.exit(failed ? 1 : 0);
