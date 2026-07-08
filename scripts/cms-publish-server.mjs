/**
 * Локальный сервер публикации (запустите один раз в папке проекта):
 *   node scripts/cms-publish-server.mjs
 *
 * Админка на сайте шлёт сюда JSON → скрипт делает git commit + push.
 */
import http from 'http';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const PORT = 4567;
const ROOT = fileURLToPath(new URL('..', import.meta.url));

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function publish(payload) {
  const { siteJson, productsJson, binaryFiles = [] } = payload;

  if (siteJson) {
    writeFileSync(join(ROOT, 'data/site.json'), JSON.stringify(siteJson, null, 2) + '\n');
  }
  if (productsJson) {
    writeFileSync(join(ROOT, 'data/products.json'), JSON.stringify(productsJson, null, 2) + '\n');
  }
  for (const file of binaryFiles) {
    if (!file?.path || !file?.base64) continue;
    const dest = join(ROOT, file.path);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, Buffer.from(file.base64, 'base64'));
  }

  execSync('git add data/site.json data/products.json assets/products', { cwd: ROOT, stdio: 'inherit' });
  try {
    execSync('git diff --staged --quiet', { cwd: ROOT });
    return 'Нет изменений для публикации';
  } catch {
    /* has staged changes */
  }
  execSync('git commit -m "CMS: publish from admin"', { cwd: ROOT, stdio: 'inherit' });
  execSync('git push', { cwd: ROOT, stdio: 'inherit' });

  const envPath = join(ROOT, 'hosting.env');
  if (existsSync(envPath)) {
    try {
      execSync('node scripts/deploy-via-ssh.mjs', { cwd: ROOT, stdio: 'inherit' });
      return 'Опубликовано на GitHub и задеплоено на by-milia.by.';
    } catch {
      return 'Опубликовано на GitHub. Деплой на by-milia.by не удался — проверьте hosting.env.';
    }
  }

  return 'Опубликовано на GitHub. by-milia.by обновится за 2–3 минуты.';
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === 'POST' && req.url === '/publish') {
    try {
      const payload = JSON.parse(await readBody(req));
      const message = publish(payload);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, message }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`CMS publish server: http://127.0.0.1:${PORT}`);
  console.log('Оставьте окно открытым. Сохраняйте в админке — публикация автоматическая.');
});
