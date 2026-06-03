/**
 * Pre-release checks: smoke, mobile meta, assets, cart form, footer map.
 * node scripts/release-check.mjs
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
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

console.log('\n=== Existing test suite ===');
try {
  execSync('node scripts/test-all.mjs', { cwd: root, stdio: 'inherit' });
} catch {
  failed += 1;
  console.error('  FAIL test-all.mjs exited with error');
}

console.log('\n=== Release checks ===');

const htmlPages = [];
function walkHtml(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'admin') continue;
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(fp);
    else if (entry.name.endsWith('.html')) htmlPages.push(fp);
  }
}
walkHtml(root);

const cssVersion = new Set();
for (const fp of htmlPages) {
  const rel = path.relative(root, fp).replace(/\\/g, '/');
  const html = fs.readFileSync(fp, 'utf8');
  if (rel.startsWith('admin/')) continue;

  if (!html.includes('viewport-fit=cover') && !html.includes('width=device-width')) {
    fail('viewport', `${rel} missing mobile viewport`);
  }

  const vMatch = html.match(/styles\.css\?v=(\d+)/);
  if (vMatch) cssVersion.add(vMatch[1]);
  else if (html.includes('styles.css')) fail('css cache', `${rel} missing ?v= on styles.css`);
}
if (cssVersion.size === 1) ok(`CSS cache version unified (v=${[...cssVersion][0]})`);
else if (cssVersion.size > 1) fail('css cache', `mixed versions: ${[...cssVersion].join(', ')}`);

const cartHtml = fs.readFileSync(path.join(root, 'cart.html'), 'utf8');
if (cartHtml.includes('name="phone"') && /name="phone"[^>]*required/.test(cartHtml)) ok('cart phone required');
else fail('cart form', 'phone not required');

if (cartHtml.includes('name="email"') && /name="email"[^>]*required/.test(cartHtml)) ok('cart email required');
else fail('cart form', 'email not required');

if (!cartHtml.includes('fab-wa') && !fs.readFileSync(path.join(root, 'js/manager.js'), 'utf8').includes('renderFab()')) {
  ok('no floating WhatsApp FAB');
} else fail('fab', 'floating WhatsApp still present');

const site = JSON.parse(fs.readFileSync(path.join(root, 'data/site.json'), 'utf8'));
const products = JSON.parse(fs.readFileSync(path.join(root, 'data/products.json'), 'utf8'));
if (site.contacts?.mapLat && site.contacts?.mapLon) ok('footer map coordinates');
else fail('contacts', 'mapLat/mapLon missing in site.json');

if (!site.pages?.wholesale?.html?.includes('pricelist.pdf')) ok('wholesale without pricelist button');
else fail('wholesale', 'pricelist PDF link still in content');

for (const p of products.products || []) {
  if (p.published === false) continue;
  const img = p.image || p.images?.[0];
  if (!img) {
    fail('product image', `${p.id} has no image`);
    continue;
  }
  if (!img.startsWith('http')) {
    const assetPath = path.join(root, img.replace(/^\.\//, ''));
    if (!fs.existsSync(assetPath)) fail('asset', `missing ${img} for ${p.id}`);
  }
}
ok('product images on disk');

const layoutJs = fs.readFileSync(path.join(root, 'js/layout.js'), 'utf8');
if (layoutJs.includes('footer-map-block') && layoutJs.includes('map-widget')) ok('footer map embed');
else fail('layout', 'footer map block missing');

if (layoutJs.includes('nav-mobile-contacts')) ok('mobile nav contacts');
else fail('layout', 'mobile nav contacts missing');

const styles = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
for (const rule of ['body.has-fab main', '.product-card-cta', '.nav-mobile-contacts', '.footer-map-block']) {
  if (styles.includes(rule)) ok(`css mobile rule ${rule}`);
  else fail('css', `missing ${rule}`);
}

console.log(failed ? `\n${failed} release check(s) failed` : '\nAll release checks passed');
process.exit(failed ? 1 : 0);
