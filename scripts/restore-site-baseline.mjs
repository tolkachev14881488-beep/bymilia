/**
 * Восстановить data/site.json и data/products.json из последней рабочей версии.
 * node scripts/restore-site-baseline.mjs
 */
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_REF = 'b7ac4df';
const PRODUCTS_REF = '06d4e4b';

execSync(`git checkout ${SITE_REF} -- data/site.json`, { cwd: root, stdio: 'inherit' });
execSync(`git checkout ${PRODUCTS_REF} -- data/products.json`, { cwd: root, stdio: 'inherit' });
console.log(`Restored site.json @ ${SITE_REF}, products.json @ ${PRODUCTS_REF}`);
console.log('Commit and push: git add data && git commit -m "Restore site baseline" && git push');
