/**
 * Разовая публикация без админки:
 *   node scripts/publish-local.mjs cms-publish-payload.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = fileURLToPath(new URL('..', import.meta.url));
const file = process.argv[2] || join(root, 'cms-publish-payload.json');
const payload = JSON.parse(readFileSync(file, 'utf8'));

if (payload.siteJson) {
  writeFileSync(join(root, 'data/site.json'), JSON.stringify(payload.siteJson, null, 2) + '\n');
}
if (payload.productsJson) {
  writeFileSync(join(root, 'data/products.json'), JSON.stringify(payload.productsJson, null, 2) + '\n');
}
for (const f of payload.binaryFiles || []) {
  if (!f?.path || !f?.base64) continue;
  const dest = join(root, f.path);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, Buffer.from(f.base64, 'base64'));
}

execSync('git add data/site.json data/products.json assets/products', { cwd: root, stdio: 'inherit' });
execSync('git commit -m "CMS: publish from local script"', { cwd: root, stdio: 'inherit' });
execSync('git push', { cwd: root, stdio: 'inherit' });
console.log('Готово.');
