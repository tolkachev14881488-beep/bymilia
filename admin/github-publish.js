import { CMS_PUBLISH_KEY } from './cms-config.js';

const GITHUB_SETTINGS_KEY = 'bymilia-github';

export function loadGithubSettings() {
  try {
    return JSON.parse(localStorage.getItem(GITHUB_SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveGithubSettings(settings) {
  const prev = loadGithubSettings();
  localStorage.setItem(GITHUB_SETTINGS_KEY, JSON.stringify({ ...prev, ...settings }));
}

export function getGithubConfig() {
  const s = loadGithubSettings();
  return {
    token: (s.token || '').trim(),
    owner: (s.owner || 'tolkachev14881488-beep').trim(),
    repo: (s.repo || 'bymilia').trim(),
    branch: (s.branch || 'main').trim(),
  };
}

export function getCmsPublishKey() {
  return (loadGithubSettings().cmsPublishKey || CMS_PUBLISH_KEY).trim();
}

/** Однократная настройка репозитория и ключа CMS (без токена) */
export function ensureDefaultPublishSettings() {
  const prev = loadGithubSettings();
  saveGithubSettings({
    owner: prev.owner || 'tolkachev14881488-beep',
    repo: prev.repo || 'bymilia',
    branch: prev.branch || 'main',
    cmsPublishKey: prev.cmsPublishKey || CMS_PUBLISH_KEY,
  });
}

export function isGithubConfigured() {
  const { token, owner, repo } = getGithubConfig();
  return Boolean(token && owner && repo && getCmsPublishKey());
}

function authHeader(token) {
  return token.startsWith('github_pat_') || token.startsWith('ghp_') || token.startsWith('gho_')
    ? `Bearer ${token}`
    : `token ${token}`;
}

function githubHeaders(token, extra = {}) {
  return {
    Authorization: authHeader(token),
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...extra,
  };
}

async function parseGhError(res) {
  let msg = `HTTP ${res.status}`;
  try {
    const data = await res.json();
    msg = data.message || msg;
    if (data.documentation_url) msg += ` (${data.documentation_url})`;
  } catch {
    try {
      msg = await res.text();
    } catch {
      /* ignore */
    }
  }
  return msg;
}

function throwGhError(res, token, owner, repo) {
  return parseGhError(res).then((msg) => {
    throw new Error(hintForTokenError(msg, owner, repo, token));
  });
}

const LOCAL_PUBLISH_HINT =
  'Проще без токена: в папке sapozhki запустите node scripts/cms-publish-server.mjs (или двойной клик start-cms-publish.bat) и снова «Сохранить» в админке.';

function hintForTokenError(message, owner, repo, token = '') {
  const m = String(message).toLowerCase();
  if (m.includes('not accessible') || m.includes('resource not accessible')) {
    const isFineGrained = String(token).startsWith('github_pat_');
    const tokenHelp = isFineGrained
      ? `Fine-grained: репозиторий ${repo}, права Contents + Actions + Metadata (Read and write).`
      : `Classic-токен от ${owner} с галочкой repo: https://github.com/settings/tokens/new?scopes=repo`;
    return (
      `Токен не может публиковать в ${owner}/${repo}. ${tokenHelp}\n\n${LOCAL_PUBLISH_HINT}`
    );
  }
  if (m.includes('bad credentials') || resStatus401(m)) {
    return `Неверный или просроченный токен. ${LOCAL_PUBLISH_HINT}`;
  }
  return message;
}

function resStatus401(m) {
  return m.includes('401');
}

/** Проверяет, что токен может читать и писать в репозиторий */
export async function verifyGithubConnection({ token, owner, repo, branch }) {
  if (!token) throw new Error('Введите Personal Access Token');

  const cmsKey = getCmsPublishKey();
  const userRes = await fetch('https://api.github.com/user', { headers: githubHeaders(token) });
  if (!userRes.ok) await throwGhError(userRes, token, owner, repo);
  const user = await userRes.json();

  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: githubHeaders(token),
  });
  if (!repoRes.ok) await throwGhError(repoRes, token, owner, repo);
  const repoData = await repoRes.json();

  if (cmsKey) {
    const canDispatch =
      !repoData.permissions ||
      repoData.permissions.admin ||
      repoData.permissions.maintain ||
      repoData.permissions.push;
    const contentsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/data/site.json?ref=${encodeURIComponent(branch || repoData.default_branch || 'main')}`,
      { headers: githubHeaders(token) },
    );
    const canWriteContents = contentsRes.ok || contentsRes.status === 404;
    if (contentsRes.status === 403) await throwGhError(contentsRes, token, owner, repo);
    return {
      login: user.login,
      repoFullName: repoData.full_name,
      defaultBranch: branch || repoData.default_branch || 'main',
      mode: canDispatch ? 'actions' : 'contents',
      canDispatch,
      canWriteContents,
    };
  }

  if (user.login && user.login.toLowerCase() !== owner.toLowerCase()) {
    throw new Error(
      `Токен от аккаунта «${user.login}», а репозиторий у «${owner}». ` +
        `Создайте токен, войдя в GitHub как ${owner}, или добавьте ${user.login} в Collaborators репозитория.`,
    );
  }

  const branchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`, {
    headers: githubHeaders(token),
  });
  if (!branchRes.ok) {
    const msg = await parseGhError(branchRes);
    throw new Error(`Ветка «${branch}» недоступна: ${msg}`);
  }

  const testPath = 'data/site.json';
  const contentsRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${testPath}?ref=${encodeURIComponent(branch)}`,
    { headers: githubHeaders(token) },
  );
  if (contentsRes.status === 403) await throwGhError(contentsRes, token, owner, repo);

  return {
    login: user.login,
    repoFullName: repoData.full_name,
    defaultBranch: repoData.default_branch,
    canWrite: !repoData.permissions || repoData.permissions.push === true || repoData.permissions.admin === true,
  };
}

function toBase64Utf8(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

async function getFileMeta({ token, owner, repo, path, branch }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, { headers: githubHeaders(token) });
  if (res.status === 404) return null;
  if (!res.ok) await throwGhError(res, token, owner, repo);
  return res.json();
}

async function putFile({ token, owner, repo, path, branch, content, message, sha, encoding = 'utf8' }) {
  const body = {
    message,
    content: encoding === 'base64' ? content : toBase64Utf8(content),
    branch,
  };
  if (sha) body.sha = sha;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: githubHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (!res.ok) await throwGhError(res, token, owner, repo);
  return res.json();
}

/** Публикует data/site.json и data/products.json в репозиторий */
export async function publishToGithub({ token, owner, repo, branch, siteJson, productsJson, extraFiles = [], skipVerify = false }) {
  if (!skipVerify) await verifyGithubConnection({ token, owner, repo, branch });

  const files = [
    { path: 'data/site.json', content: JSON.stringify(siteJson, null, 2) + '\n' },
    { path: 'data/products.json', content: JSON.stringify(productsJson, null, 2) + '\n' },
    ...extraFiles,
  ];
  const results = [];
  for (const file of files) {
    const meta = await getFileMeta({ token, owner, repo, path: file.path, branch });
    results.push(
      await putFile({
        token,
        owner,
        repo,
        branch,
        path: file.path,
        content: file.content,
        message: `CMS: update ${file.path}`,
        sha: meta?.sha,
      }),
    );
  }
  return results;
}

const LOCAL_PUBLISH_URL = 'http://127.0.0.1:4567';

export async function isLocalPublishAvailable() {
  try {
    const res = await fetch(`${LOCAL_PUBLISH_URL}/health`, { signal: AbortSignal.timeout(1200) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Публикация через git на этом компьютере (без GitHub API) */
export async function publishViaLocalServer({ siteJson, productsJson, uploads = [] }) {
  const binaryFiles = [];
  for (const { path, file } of uploads) {
    binaryFiles.push({ path, base64: await fileToBase64(file) });
  }
  const res = await fetch(`${LOCAL_PUBLISH_URL}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ siteJson, productsJson, binaryFiles }),
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Локальный сервер публикации не ответил');
  }
  return data.message;
}

/** Публикация через GitHub Actions (не нужен Contents API на токене) */
export async function publishViaActions({ token, owner, repo, cmsKey, siteJson, productsJson, uploads = [] }) {
  const binaryFiles = [];
  for (const { path, file } of uploads) {
    binaryFiles.push({ path, base64: await fileToBase64(file) });
  }
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
    method: 'POST',
    headers: githubHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      event_type: 'cms_publish',
      client_payload: {
        key: cmsKey,
        siteJson,
        productsJson,
        binaryFiles: binaryFiles.slice(0, 8),
      },
    }),
  });
  if (!res.ok) await throwGhError(res, token, owner, repo);
}

/** Прямая запись JSON в репозиторий (Classic repo или Fine-grained Contents) */
export async function publishViaGithubApi(cfg, { siteJson, productsJson, uploads = [] }) {
  await verifyGithubConnection(cfg);
  if (uploads.length) await uploadBinaryFiles(uploads);
  await publishToGithub({ ...cfg, siteJson, productsJson, skipVerify: true });
  return {
    mode: 'github',
    message: 'Файлы обновлены в GitHub. Сайт обновится за 1–2 минуты.',
  };
}

/** Публикует контент сайта */
export async function publishSiteContent({ siteJson, productsJson, uploads = [] }) {
  if (await isLocalPublishAvailable()) {
    const message = await publishViaLocalServer({ siteJson, productsJson, uploads });
    return { mode: 'local', message };
  }

  const cfg = getGithubConfig();
  const cmsKey = getCmsPublishKey();
  if (!cfg.token || !cfg.owner || !cfg.repo) {
    throw new Error(LOCAL_PUBLISH_HINT);
  }

  if (cmsKey) {
    try {
      await publishViaActions({ ...cfg, cmsKey, siteJson, productsJson, uploads });
      return {
        mode: 'actions',
        message: 'Изменения отправлены в GitHub Actions. Сайт обновится за 1–2 минуты.',
      };
    } catch (actionsErr) {
      try {
        return await publishViaGithubApi(cfg, { siteJson, productsJson, uploads });
      } catch (apiErr) {
        throw new Error(`${actionsErr.message}\n\nЗапасной способ тоже не сработал: ${apiErr.message}`);
      }
    }
  }

  return publishViaGithubApi(cfg, { siteJson, productsJson, uploads });
}

export function downloadPublishPayload(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cms-publish-payload.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Загружает бинарные файлы (фото) в репозиторий */
export async function uploadBinaryFiles(files, { messagePrefix = 'CMS: product photo' } = {}) {
  const cfg = getGithubConfig();
  if (!cfg.token) throw new Error('Подключите GitHub-токен');
  await verifyGithubConnection(cfg);
  const uploaded = [];
  for (const { path, file } of files) {
    const base64 = await fileToBase64(file);
    const meta = await getFileMeta({ ...cfg, path });
    await putFile({
      ...cfg,
      path,
      content: base64,
      encoding: 'base64',
      message: `${messagePrefix} ${path}`,
      sha: meta?.sha,
    });
    uploaded.push(path);
  }
  return uploaded;
}
