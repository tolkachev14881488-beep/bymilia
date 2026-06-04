/**
 * Полный аудит админ-панели: UI, модули, публикация, товары.
 * node scripts/admin-panel-test.mjs
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

const adminHtml = fs.readFileSync(path.join(root, 'admin/index.html'), 'utf8');
const adminJs = fs.readFileSync(path.join(root, 'admin/admin.js'), 'utf8');
const modJs = fs.readFileSync(path.join(root, 'admin/product-moderation.js'), 'utf8');
const publishJs = fs.readFileSync(path.join(root, 'admin/github-publish.js'), 'utf8');
const dashboardJs = fs.readFileSync(path.join(root, 'admin/dashboard.js'), 'utf8');
const labelsJs = fs.readFileSync(path.join(root, 'admin/page-labels.js'), 'utf8');
const cmsConfig = fs.readFileSync(path.join(root, 'admin/cms-config.js'), 'utf8');
const adminCss = fs.readFileSync(path.join(root, 'admin/admin.css'), 'utf8');

console.log('\n=== Структура admin/index.html ===');
const tabs = ['dashboard', 'products', 'homepage', 'pages', 'settings', 'publish'];
for (const tab of tabs) {
  if (!adminHtml.includes(`data-tab="${tab}"`) || !adminHtml.includes(`data-panel="${tab}"`)) {
    fail('tabs', tab);
  }
}
ok(`все ${tabs.length} вкладок`);

const uiIds = [
  'login-form',
  'reload-btn',
  'publish-now-btn',
  'dashboard-root',
  'product-moderation-list',
  'product-moderation-editor',
  'homepage-form',
  'page-select',
  'page-form',
  'settings-form',
  'wb-import-btn',
  'add-product-btn',
  'check-token-btn',
  'test-github-btn',
  'download-json-btn',
  'gh-token',
  'unsaved-badge',
  'publish-status',
];
for (const id of uiIds) {
  if (!adminHtml.includes(`id="${id}"`) && !adminHtml.includes(`id='${id}'`)) {
    fail('html id', id);
  }
}
ok('ключевые элементы UI');

if (!adminHtml.includes('data-site-root=".."')) fail('html', 'data-site-root');
else ok('data-site-root=".." (пути к data/)');

if (adminHtml.includes('bymilia2026') || /password.*hint|пароль.*123/i.test(adminHtml)) {
  fail('security', 'подсказка пароля в HTML');
} else ok('нет подсказки пароля в HTML');

if (adminHtml.includes('noindex')) ok('robots noindex');
else fail('seo', 'admin should be noindex');

console.log('\n=== admin.js — логика ===');
const adminChecks = [
  ['validateDraftBeforePublish', 'guard публикации'],
  ['collectAllForms', 'сбор всех форм'],
  ['if (!skipCollectForms) collectAllForms()', 'publish → collectAllForms'],
  ['applyCmsPayload', 'обновление после publish'],
  ['buildDraftFromServer', 'черновик с сервера'],
  ['queuePublish', 'очередь публикации'],
  ['saveProductFromModeration', 'сохранение товара'],
  ['collectHomepage', 'главная'],
  ['collectPage', 'страницы'],
  ['collectSettings', 'настройки'],
  ['hp-hero-image', 'поле фото главной'],
  ['stats: prevHero.stats', 'сохранение stats'],
  ['hero.heroImage', 'валидация heroImage'],
  ['hero.stats?.length', 'валидация stats'],
  ['thinPages', 'защита от пустых страниц'],
  ['applySetupFromHash', 'автонастройка из URL'],
  ['fetchWbCatalog', 'импорт WB'],
  ['downloadPublishPayload', 'резерв JSON при ошибке'],
];
for (const [needle, label] of adminChecks) {
  if (!adminJs.includes(needle)) fail('admin.js', label);
  else ok(label);
}

if (adminJs.match(/if \(!skipCollectForms\) collectActivePanelForms/)) {
  fail('admin.js', 'publish использует только активную вкладку');
}

console.log('\n=== product-moderation.js ===');
for (const needle of [
  'initProductModeration',
  'onSaveProduct',
  'onDraftChange',
  'published',
  '_pendingUploads',
  'productThumb',
  'mod-card',
]) {
  if (!modJs.includes(needle)) fail('moderation', needle);
  else ok(needle);
}
if (modJs.includes('onQuickPublish')) fail('moderation', 'устаревший onQuickPublish');

console.log('\n=== github-publish.js ===');
for (const fn of [
  'publishSiteContent',
  'publishViaLocalServer',
  'publishViaActions',
  'publishViaGithubApi',
  'verifyGithubConnection',
  'uploadBinaryFiles',
  'ensureDefaultPublishSettings',
]) {
  if (!publishJs.includes(fn)) fail('github-publish', fn);
  else ok(fn);
}
if (!publishJs.includes('binaryFiles.slice(0, 20)')) fail('github-publish', 'лимит фото 20');

console.log('\n=== dashboard + page-labels ===');
if (!dashboardJs.includes('renderDashboard') || !dashboardJs.includes('dash-publish-btn')) {
  fail('dashboard', 'renderDashboard');
} else ok('dashboard.js');

const pageIds = ['about', 'delivery', 'wholesale', 'contacts', 'faq', 'privacy', 'offer'];
for (const id of pageIds) {
  if (!labelsJs.includes(id)) fail('page-labels', id);
}
ok(`page-labels (${pageIds.length}+ страниц)`);

console.log('\n=== cms-config + workflow ===');
const keyMatch = cmsConfig.match(/CMS_PUBLISH_KEY\s*=\s*'([^']+)'/);
if (!keyMatch) fail('cms-config', 'CMS_PUBLISH_KEY');
else {
  ok('CMS_PUBLISH_KEY');
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/cms-publish.yml'), 'utf8');
  if (!workflow.includes(keyMatch[1])) fail('workflow', 'ключ не совпадает с cms-config');
  else ok('workflow ключ совпадает');
}

console.log('\n=== admin.css (мобилка) ===');
if (adminCss.includes('@media') && adminCss.includes('admin-sidebar')) ok('responsive admin.css');
else fail('admin.css', 'нет mobile rules');

console.log('\n=== ESM-импорты admin.js ===');
if (adminJs.includes("from '../js/data-store.js'")) ok('импорт data-store');
else fail('imports', 'data-store');
if (adminJs.includes("from './github-publish.js'")) ok('импорт github-publish');
else fail('imports', 'github-publish');

console.log('\n=== Симуляция validateDraftBeforePublish ===');
const site = JSON.parse(fs.readFileSync(path.join(root, 'data/site.json'), 'utf8'));
const products = JSON.parse(fs.readFileSync(path.join(root, 'data/products.json'), 'utf8'));
const draft = {
  products: products.products,
  homepage: site.homepage,
  pages: site.pages,
};

function validateDraft(d) {
  const published = (d.products || []).filter((p) => p.published !== false);
  if (published.length < 1) throw new Error('no products');
  if (Object.keys(d.pages || {}).length < 5) throw new Error('few pages');
  const hero = d.homepage?.hero || {};
  if (!String(hero.titleHtml || '').trim() && !String(hero.lead || '').trim()) {
    throw new Error('empty hero');
  }
  if (!String(hero.heroImage || '').trim()) throw new Error('no heroImage');
  if (!hero.stats?.length) throw new Error('no stats');
  if (!String(d.homepage?.seo?.metaTitle || '').trim()) throw new Error('no seo');
  const thin = Object.entries(d.pages || {}).filter(
    ([, p]) => String(p?.html || '').replace(/<[^>]+>/g, '').trim().length < 60,
  );
  if (thin.length) throw new Error(`thin: ${thin.map(([id]) => id).join(',')}`);
}

try {
  validateDraft(draft);
  ok('текущий site.json проходит validateDraftBeforePublish');
} catch (e) {
  fail('validate simulation', e.message);
}

console.log('\n=== Запуск связанных тестов ===');
const suite = [
  'cms-publish-test.mjs',
  'admin-cms-test.mjs',
  'admin-product-save-test.mjs',
  'admin-publish-integration-test.mjs',
];
for (const script of suite) {
  try {
    execSync(`node scripts/${script}`, { cwd: root, stdio: 'pipe' });
    ok(`suite: ${script}`);
  } catch (e) {
    fail(`suite: ${script}`, e.stderr?.toString() || e.message);
  }
}

console.log(failed ? `\n${failed} проверок админки не пройдено` : '\nВсе тесты админ-панели пройдены');
process.exit(failed ? 1 : 0);
