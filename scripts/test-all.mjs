import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const script of [
  'cms-publish-test.mjs',
  'site-smoke-test.mjs',
  'admin-product-save-test.mjs',
  'admin-cms-test.mjs',
  'admin-publish-integration-test.mjs',
  'design-responsive-test.mjs',
]) {
  console.log(`\n=== ${script} ===`);
  execSync(`node scripts/${script}`, { cwd: root, stdio: 'inherit' });
}
