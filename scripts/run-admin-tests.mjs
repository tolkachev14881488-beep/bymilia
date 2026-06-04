/**
 * Запуск всех тестов админ-панели одной командой.
 * node scripts/run-admin-tests.mjs
 */
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const scripts = [
  'admin-panel-test.mjs',
];

console.log('=== Тесты админ-панели By Milia ===\n');
for (const script of scripts) {
  console.log(`--- ${script} ---`);
  execSync(`node scripts/${script}`, { cwd: root, stdio: 'inherit' });
}
