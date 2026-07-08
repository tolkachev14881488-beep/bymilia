#!/usr/bin/env node
/**
 * Добавляет OPENAI_API_KEY на Vercel и передеплоит.
 * Использование: node scripts/setup-openai.mjs sk-...
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const key = process.argv[2]?.trim();
if (!key || !key.startsWith('sk-')) {
  console.error('Укажите ключ: node scripts/setup-openai.mjs sk-...');
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function run(cmd, args, input) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log('Добавляю OPENAI_API_KEY на Vercel (production)...');
run(npx, ['--yes', 'vercel', 'env', 'add', 'OPENAI_API_KEY', 'production', '--yes'], `${key}\n`);

console.log('Добавляю OPENAI_MODEL=gpt-4o-mini...');
run(
  npx,
  ['--yes', 'vercel', 'env', 'add', 'OPENAI_MODEL', 'production', '--value', 'gpt-4o-mini', '--yes'],
);

console.log('Деплой production...');
run(npx, ['--yes', 'vercel', 'deploy', '--prod', '--yes']);

console.log('Готово. Откройте https://consultant-dusky.vercel.app');
