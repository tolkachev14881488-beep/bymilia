/**
 * Сборка deploy/ и ZIP для загрузки в cPanel → Менеджер файлов.
 * node scripts/make-hosting-zip.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const domain = (process.argv[2] || 'https://by-milia.by').replace(/\/$/, '');

execSync(`node scripts/prepare-hosting-deploy.mjs ${domain}`, {
  cwd: root,
  stdio: 'inherit',
});

const zipName = 'by-milia-site.zip';
const zipPath = path.join(root, zipName);
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

const deployDir = path.join(root, 'deploy');
if (process.platform === 'win32') {
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${deployDir}\\*' -DestinationPath '${zipPath}' -Force"`,
    { stdio: 'inherit' },
  );
} else {
  execSync(`cd deploy && zip -r ../${zipName} .`, { cwd: root, stdio: 'inherit' });
}

console.log(`\nГотово: ${zipPath}`);
console.log('cPanel → Менеджер файлов → public_html → Загрузить → Распаковать');
