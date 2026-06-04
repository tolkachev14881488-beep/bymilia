/**
 * Тесты клиентской админки (структура и логика).
 * node scripts/admin-cms-test.mjs
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

const adminHtml = fs.readFileSync(path.join(root, 'admin/index.html'), 'utf8');
const adminJs = fs.readFileSync(path.join(root, 'admin/admin.js'), 'utf8');
const modJs = fs.readFileSync(path.join(root, 'admin/product-moderation.js'), 'utf8');

for (const id of ['dashboard-root', 'data-tab="dashboard"', 'data-panel="dashboard"', 'publish-now-btn']) {
  if (!adminHtml.includes(id)) fail('admin html', `missing ${id}`);
}
ok('admin dashboard UI');

if (adminHtml.includes('bymilia2026')) fail('security', 'password hint in login');
else ok('no password hint on login');

if (!modJs.includes('onDraftChange')) fail('product-moderation', 'onDraftChange');
if (modJs.includes('onQuickPublish')) fail('product-moderation', 'still uses onQuickPublish');
else ok('draft-only product toggles');

if (!adminJs.includes('validateDraftBeforePublish')) fail('admin.js', 'validateDraftBeforePublish');
if (!adminJs.includes('skipCollectForms')) fail('admin.js', 'skipCollectForms');
if (!adminJs.includes('applyCmsPayload')) fail('admin.js', 'applyCmsPayload');
if (!adminJs.includes('function collectAllForms()')) fail('admin.js', 'collectAllForms');
if (!adminJs.includes('stats: prevHero.stats')) fail('admin.js', 'collectHomepage must preserve hero.stats');
if (!adminJs.includes('hp-hero-image')) fail('admin.js', 'hero image admin field');
if (adminJs.match(/if \(!skipCollectForms\) collectActivePanelForms/)) {
  fail('admin.js', 'publish must use collectAllForms not active panel only');
}
else ok('admin publish guards');

const labels = fs.readFileSync(path.join(root, 'admin/page-labels.js'), 'utf8');
if (!labels.includes('wholesale')) fail('page-labels', 'wholesale');
else ok('page-labels');

const dashboard = fs.readFileSync(path.join(root, 'admin/dashboard.js'), 'utf8');
if (!dashboard.includes('renderDashboard')) fail('dashboard.js', 'renderDashboard');
else ok('dashboard.js');

console.log(failed ? `\n${failed} failed` : '\nAdmin CMS tests passed');
process.exit(failed ? 1 : 0);
