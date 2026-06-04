/**
 * Интеграционные проверки публикации из админки (логика без браузера).
 * node scripts/admin-publish-integration-test.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function ok(m) {
  console.log(`  OK ${m}`);
}
function fail(m, d) {
  failed += 1;
  console.error(`  FAIL ${m}: ${d}`);
}

const adminJs = fs.readFileSync(path.join(root, 'admin/admin.js'), 'utf8');
const homeJs = fs.readFileSync(path.join(root, 'js/home.js'), 'utf8');
const siteJson = JSON.parse(fs.readFileSync(path.join(root, 'data/site.json'), 'utf8'));

if (!adminJs.includes('function collectAllForms()')) fail('collectAllForms', 'missing');
else if (!adminJs.includes('if (!skipCollectForms) collectAllForms()')) {
  fail('publishToSite', 'must call collectAllForms before publish');
} else ok('publish collects all CMS forms');

if (/collectActivePanelForms\(\)[\s\S]{0,80}only active/i.test(adminJs)) {
  fail('collectActivePanelForms', 'still documents active-only');
}

if (!adminJs.includes('stats: prevHero.stats')) {
  fail('collectHomepage', 'hero.stats not preserved on save');
} else ok('collectHomepage keeps hero.stats');

if (!adminJs.includes('hp-hero-image') || !adminJs.includes('heroImage: val')) {
  fail('collectHomepage', 'heroImage field missing in admin');
} else ok('admin hero image field');

if (homeJs.includes('getPublishedProducts().find((p) => p.image)')) {
  fail('home.js', 'hero still falls back to product image');
} else ok('hero image independent from catalog');

if (homeJs.includes('HERO_PALETTE_LABELS')) {
  fail('home.js', 'hardcoded palette labels override colorName from admin');
} else ok('hero palette uses colorName from products.json');

const pageIds = Object.keys(siteJson.pages || {});
if (pageIds.length < 8) fail('site.json pages', `only ${pageIds.length} pages`);
else ok(`site.json has ${pageIds.length} pages`);

const hero = siteJson.homepage?.hero || {};
if (!hero.heroImage) fail('site.json hero', 'heroImage missing');
else ok('site.json heroImage set');

const products = JSON.parse(fs.readFileSync(path.join(root, 'data/products.json'), 'utf8'));
const published = (products.products || []).filter((p) => p.published !== false);
if (published.length < 1) fail('products.json', 'no published products');
else ok(`${published.length} published products`);

function simulateSitePayload(draft) {
  const { products, ...site } = draft;
  return site;
}

const draft = {
  products: products.products,
  homepage: {
    hero: {
      eyebrow: 'x',
      titleHtml: 'y',
      lead: 'z',
      heroImage: 'assets/products/hero-bright.png',
      imageAlt: 'alt',
      stats: [{ value: '4', label: 'цвета' }],
      tags: ['a'],
      cardLabel: 'By Milia',
      cardSub: 'Минск',
    },
    marquee: ['m'],
    pages: siteJson.pages,
  },
  pages: siteJson.pages,
  site: siteJson.site,
  contacts: siteJson.contacts,
  delivery: siteJson.delivery,
  sizes: siteJson.sizes,
  deliveryOptions: siteJson.deliveryOptions,
  admin: siteJson.admin,
};

const payload = simulateSitePayload(draft);
if (!payload.homepage?.hero?.stats?.length) fail('sitePayload', 'hero.stats dropped');
if (!payload.pages || Object.keys(payload.pages).length < 5) fail('sitePayload', 'pages missing');
else ok('sitePayload shape');

const cmsConfig = fs.readFileSync(path.join(root, 'admin/cms-config.js'), 'utf8');
const keyMatch = cmsConfig.match(/CMS_PUBLISH_KEY\s*=\s*'([^']+)'/);
const cmsKey = keyMatch?.[1];
const tmpSite = path.join(root, 'data/site.json');
const tmpProducts = path.join(root, 'data/products.json');
const backupSite = fs.readFileSync(tmpSite, 'utf8');
const backupProducts = fs.readFileSync(tmpProducts, 'utf8');

const testSite = structuredClone(siteJson);
testSite.site.brand = 'CMS Integration Test';
const testProducts = { products: published.slice(0, 2) };

try {
  execSync('node .github/scripts/cms-apply-payload.mjs', {
    cwd: root,
    env: {
      ...process.env,
      CMS_KEY: cmsKey,
      PAYLOAD: JSON.stringify({
        key: cmsKey,
        siteJson: testSite,
        productsJson: testProducts,
      }),
    },
    stdio: 'pipe',
  });
  const applied = JSON.parse(fs.readFileSync(tmpSite, 'utf8'));
  if (applied.site?.brand !== 'CMS Integration Test') fail('apply full payload', 'brand');
  if (!applied.homepage?.hero?.heroImage) fail('apply full payload', 'heroImage lost');
  if (!applied.homepage?.hero?.stats?.length) fail('apply full payload', 'hero.stats lost');
  const appliedProducts = JSON.parse(fs.readFileSync(tmpProducts, 'utf8'));
  if (appliedProducts.products?.length !== testProducts.products.length) {
    fail('apply full payload', 'products count');
  } else ok('cms apply keeps homepage hero + products');
} catch (e) {
  fail('cms apply', e.stderr?.toString() || e.message);
} finally {
  fs.writeFileSync(tmpSite, backupSite);
  fs.writeFileSync(tmpProducts, backupProducts);
}

const publishJs = fs.readFileSync(path.join(root, 'admin/github-publish.js'), 'utf8');
if (!publishJs.includes('binaryFiles.slice(0, 20)')) {
  fail('github-publish', 'binary upload cap should be 20');
} else ok('github publish binary limit');

console.log(failed ? `\n${failed} failed` : '\nAdmin publish integration tests passed');
process.exit(failed ? 1 : 0);
