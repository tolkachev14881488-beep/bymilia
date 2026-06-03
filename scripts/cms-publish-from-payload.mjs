/**
 * Публикация из скачанного cms-publish-payload.json
 * node scripts/cms-publish-from-payload.mjs [путь-к-файлу]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const input =
  process.argv[2] ||
  path.join(process.env.USERPROFILE || '', 'Downloads', 'cms-publish-payload.json');

if (!fs.existsSync(input)) {
  console.error(`Файл не найден: ${input}`);
  console.error('Укажите путь: node scripts/cms-publish-from-payload.mjs путь\\к\\файлу.json');
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(input, 'utf8'));
const { siteJson, productsJson } = payload;

if (siteJson) {
  fs.writeFileSync(path.join(root, 'data/site.json'), JSON.stringify(siteJson, null, 2) + '\n');
}
if (productsJson) {
  fs.writeFileSync(
    path.join(root, 'data/products.json'),
    JSON.stringify(productsJson, null, 2) + '\n',
  );
}

execSync('git add data/site.json data/products.json', { cwd: root, stdio: 'inherit' });
try {
  execSync('git diff --staged --quiet', { cwd: root });
  console.log('Нет изменений для публикации');
  process.exit(0);
} catch {
  /* has changes */
}
execSync('git commit -m "CMS: publish from payload file"', { cwd: root, stdio: 'inherit' });
execSync('git push', { cwd: root, stdio: 'inherit' });
console.log('Опубликовано. Сайт обновится за 1–2 минуты.');
