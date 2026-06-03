/**
 * Тесты CMS: ключ, apply-payload, пути админки, workflow.
 * Запуск: node scripts/cms-publish-test.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function ok(label) {
  console.log(`  OK ${label}`);
}

function fail(label, detail) {
  failed += 1;
  console.error(`  FAIL ${label}: ${detail}`);
}

const cmsConfig = fs.readFileSync(path.join(root, 'admin/cms-config.js'), 'utf8');
const keyMatch = cmsConfig.match(/CMS_PUBLISH_KEY\s*=\s*'([^']+)'/);
const cmsKey = keyMatch?.[1];
if (!cmsKey) fail('cms-config', 'CMS_PUBLISH_KEY not found');
else ok('cms-config key');

const workflow = fs.readFileSync(path.join(root, '.github/workflows/cms-publish.yml'), 'utf8');
if (!workflow.includes('repository_dispatch') || !workflow.includes('cms_publish')) {
  fail('workflow', 'missing repository_dispatch cms_publish');
} else if (!workflow.includes(cmsKey)) {
  fail('workflow', 'CMS_KEY mismatch with admin/cms-config.js');
} else ok('workflow cms-publish.yml');

const adminHtml = fs.readFileSync(path.join(root, 'admin/index.html'), 'utf8');
if (!adminHtml.includes('data-site-root=".."')) fail('admin html', 'missing data-site-root');
else ok('admin data-site-root');

function adminDataUrl(pathname) {
  const p = pathname.replace(/\\/g, '/');
  const m = p.match(/^(.*)\/admin\/[^/]*$/);
  const base = m ? `${m[1]}/` : p.replace(/\/[^/]*$/, '/');
  return `${base}data/site.json`;
}

if (adminDataUrl('/bymilia/admin/index.html') !== '/bymilia/data/site.json') {
  fail('admin path', adminDataUrl('/bymilia/admin/index.html'));
} else ok('admin JSON path /bymilia/admin/');

const siteJson = { site: { brand: 'Test CMS' }, pages: {} };
const productsJson = { products: [{ id: 'wb-black', colorName: 'T', published: true, price: 1 }] };
const tmpSite = path.join(root, 'data/site.json');
const tmpProducts = path.join(root, 'data/products.json');
const backupSite = fs.readFileSync(tmpSite, 'utf8');
const backupProducts = fs.readFileSync(tmpProducts, 'utf8');

try {
  execSync(`node .github/scripts/cms-apply-payload.mjs`, {
    cwd: root,
    env: {
      ...process.env,
      CMS_KEY: cmsKey,
      PAYLOAD: JSON.stringify({ key: cmsKey, siteJson, productsJson }),
    },
    stdio: 'pipe',
  });
  const applied = JSON.parse(fs.readFileSync(tmpSite, 'utf8'));
  if (applied.site?.brand !== 'Test CMS') fail('apply-payload', 'site.json not updated');
  else ok('cms-apply-payload valid key');
} catch (e) {
  fail('apply-payload', e.stderr?.toString() || e.message);
} finally {
  fs.writeFileSync(tmpSite, backupSite);
  fs.writeFileSync(tmpProducts, backupProducts);
}

try {
  execSync(`node .github/scripts/cms-apply-payload.mjs`, {
    cwd: root,
    env: {
      ...process.env,
      CMS_KEY: cmsKey,
      PAYLOAD: JSON.stringify({ key: 'wrong', siteJson }),
    },
    stdio: 'pipe',
  });
  fail('apply-payload reject', 'should exit 1 on bad key');
} catch (e) {
  if (e.status === 1) ok('cms-apply-payload rejects bad key');
  else fail('apply-payload reject', e.message);
}

const publishJs = fs.readFileSync(path.join(root, 'admin/github-publish.js'), 'utf8');
for (const fn of ['publishViaActions', 'publishSiteContent', 'ensureDefaultPublishSettings']) {
  if (!publishJs.includes(fn)) fail('github-publish', `missing ${fn}`);
}
ok('github-publish API');

console.log(failed ? `\n${failed} failed` : '\nAll CMS tests passed');
process.exit(failed ? 1 : 0);
