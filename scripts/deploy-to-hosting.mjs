/**
 * Загрузка deploy/ на hoster.by по FTP (ISPmanager).
 *
 * 1. Скопируйте hosting.env.example → hosting.env
 * 2. Заполните FTP_HOST, FTP_USER, FTP_PASS, FTP_DIR
 * 3. node scripts/deploy-to-hosting.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { Client } from 'basic-ftp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, 'hosting.env');

function loadEnv() {
  if (!fs.existsSync(envPath)) {
    console.error('Нет файла hosting.env — скопируйте hosting.env.example и заполните FTP-данные.');
    process.exit(1);
  }
  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

async function uploadDir(client, localDir, remoteDir) {
  await client.ensureDir(remoteDir);
  await client.cd(remoteDir);
  for (const name of fs.readdirSync(localDir)) {
    const local = path.join(localDir, name);
    const st = fs.statSync(local);
    if (st.isDirectory()) {
      await uploadDir(client, local, name);
      await client.cd('..');
    } else {
      process.stdout.write(`  ↑ ${remoteDir}/${name}\n`);
      await client.uploadFrom(local, name);
    }
  }
}

const env = loadEnv();
const host = env.FTP_HOST;
const user = env.FTP_USER;
const pass = env.FTP_PASS;
const remote = env.FTP_DIR || '/www/by-milia.by/data';
const domain = env.SITE_URL || 'https://by-milia.by';

if (!host || !user || !pass) {
  console.error('В hosting.env нужны FTP_HOST, FTP_USER, FTP_PASS');
  process.exit(1);
}

execSync(`node scripts/prepare-hosting-deploy.mjs ${domain}`, { cwd: root, stdio: 'inherit' });

const client = new Client(60000);
client.ftp.verbose = false;
try {
  console.log(`Подключение к ${host}…`);
  await client.access({ host, user, password: pass, secure: false });
  console.log(`Загрузка в ${remote}…`);
  await uploadDir(client, path.join(root, 'deploy'), remote);
  console.log('\nСайт загружен. Откройте:', domain);
} catch (e) {
  console.error('Ошибка FTP:', e.message);
  console.error('\nАльтернатива: node scripts/make-hosting-zip.mjs → загрузите ZIP в ISPmanager → Файлы → www/by-milia.by/data');
  process.exit(1);
} finally {
  client.close();
}
