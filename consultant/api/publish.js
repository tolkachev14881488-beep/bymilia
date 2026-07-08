import { Client } from 'ssh2';

const MAX_BINARY_FILES = 20;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, body) {
  setCors(res);
  res.status(status).json(body);
}

function getConfig() {
  return {
    cmsKey: (process.env.CMS_PUBLISH_KEY || '').trim(),
    host: (process.env.PUBLISH_SSH_HOST || process.env.SSH_HOST || '').trim(),
    user: (process.env.PUBLISH_SSH_USER || process.env.SSH_USER || '').trim(),
    pass: (process.env.PUBLISH_SSH_PASS || process.env.SSH_PASS || '').trim(),
    port: Number(process.env.PUBLISH_SSH_PORT || process.env.SSH_PORT || 22),
    root: (process.env.PUBLISH_ROOT || 'www/by-milia.by').replace(/\/+$/, ''),
  };
}

function normalizeRemotePath(root, targetPath) {
  const clean = String(targetPath || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  if (!clean || clean.includes('..')) {
    throw new Error(`Недопустимый путь: ${targetPath}`);
  }
  return `${root}/${clean}`;
}

function createJsonBuffer(data) {
  return Buffer.from(`${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function mkdirSafe(sftp, dir) {
  return new Promise((resolve, reject) => {
    sftp.mkdir(dir, (err) => {
      if (!err) return resolve();
      if (String(err.message || '').includes('Failure')) return resolve();
      if (String(err.message || '').includes('exists')) return resolve();
      reject(err);
    });
  });
}

async function ensureRemoteDir(sftp, remotePath) {
  const parts = remotePath.split('/').filter(Boolean);
  let current = '';
  for (let i = 0; i < parts.length - 1; i += 1) {
    current = current ? `${current}/${parts[i]}` : parts[i];
    await mkdirSafe(sftp, current);
  }
}

function writeRemoteFile(sftp, remotePath, buffer) {
  return new Promise((resolve, reject) => {
    const stream = sftp.createWriteStream(remotePath, { flags: 'w', encoding: null, mode: 0o644 });
    stream.on('error', reject);
    stream.on('close', resolve);
    stream.end(buffer);
  });
}

async function uploadFiles(config, files) {
  const conn = new Client();
  return new Promise((resolve, reject) => {
    conn
      .on('ready', () => {
        conn.sftp(async (err, sftp) => {
          if (err) {
            conn.end();
            reject(err);
            return;
          }
          try {
            for (const file of files) {
              const remotePath = normalizeRemotePath(config.root, file.path);
              await ensureRemoteDir(sftp, remotePath);
              await writeRemoteFile(sftp, remotePath, file.buffer);
            }
            conn.end();
            resolve();
          } catch (uploadErr) {
            conn.end();
            reject(uploadErr);
          }
        });
      })
      .on('error', reject)
      .connect({
        host: config.host,
        port: config.port,
        username: config.user,
        password: config.pass,
        readyTimeout: 30000,
      });
  });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Только POST' });
  }

  const config = getConfig();
  if (!config.cmsKey || !config.host || !config.user || !config.pass) {
    return json(res, 500, { error: 'Publish API не настроен на сервере' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return json(res, 400, { error: 'Некорректный JSON' });
  }

  if ((body?.key || '').trim() !== config.cmsKey) {
    return json(res, 403, { error: 'Неверный ключ публикации' });
  }

  const binaryFiles = Array.isArray(body?.binaryFiles) ? body.binaryFiles.slice(0, MAX_BINARY_FILES) : [];
  const files = [];

  if (body?.siteJson) {
    files.push({ path: 'data/site.json', buffer: createJsonBuffer(body.siteJson) });
  }
  if (body?.productsJson) {
    files.push({ path: 'data/products.json', buffer: createJsonBuffer(body.productsJson) });
  }

  for (const file of binaryFiles) {
    if (!file?.path || !file?.base64) continue;
    files.push({
      path: file.path,
      buffer: Buffer.from(String(file.base64), 'base64'),
    });
  }

  if (!files.length) {
    return json(res, 400, { error: 'Нет данных для публикации' });
  }

  try {
    await uploadFiles(config, files);
    return json(res, 200, {
      ok: true,
      message: 'Изменения загружены напрямую на by-milia.by.',
      uploaded: files.map((file) => file.path),
    });
  } catch (err) {
    console.error('publish error:', err);
    return json(res, 500, { error: 'Не удалось загрузить файлы на hoster.by' });
  }
}
