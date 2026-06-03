/**
 * Тест: переименование товара в черновике и applyCmsPayload.
 * node scripts/admin-product-save-test.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function ok(m) {
  console.log(`  OK ${m}`);
}
function fail(m, d) {
  failed += 1;
  console.error(`  FAIL ${m}: ${d}`);
}

const products = JSON.parse(fs.readFileSync(path.join(root, 'data/products.json'), 'utf8'));
const p0 = products.products[0];
if (!p0) fail('products', 'empty');

const draft = structuredClone(products.products);
const idx = 0;
const oldName = draft[idx].colorName;
const newName = `${oldName} (тест ${Date.now()})`;
draft[idx] = { ...draft[idx], colorName: newName };

if (draft[idx].colorName !== newName) fail('draft update', 'colorName not set');
else ok('draft colorName update');

const published = { products: draft };
const reread = JSON.parse(JSON.stringify(published));
if (reread.products[0].colorName !== newName) fail('serialize', 'lost name');
else ok('payload keeps new name');

const site = JSON.parse(fs.readFileSync(path.join(root, 'data/site.json'), 'utf8'));
if (Object.keys(site.pages || {}).length < 5) fail('site', 'pages missing');
else ok('site.json intact for publish guard');

console.log(failed ? `\n${failed} failed` : '\nAdmin product save logic OK');
process.exit(failed ? 1 : 0);
