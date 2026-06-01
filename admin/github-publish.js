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

export function isGithubConfigured() {
  const { token, owner, repo } = getGithubConfig();
  return Boolean(token && owner && repo);
}

function toBase64Utf8(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

async function getFileMeta({ token, owner, repo, path, branch }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
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
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = await res.text();
    try {
      detail = JSON.parse(detail).message || detail;
    } catch {
      /* keep text */
    }
    throw new Error(detail);
  }
  return res.json();
}

/** Публикует data/site.json и data/products.json в репозиторий */
export async function publishToGithub({ token, owner, repo, branch, siteJson, productsJson, extraFiles = [] }) {
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

/** Публикует контент сайта, используя сохранённые настройки GitHub */
export async function publishSiteContent({ siteJson, productsJson, extraFiles = [] }) {
  const cfg = getGithubConfig();
  if (!cfg.token || !cfg.owner || !cfg.repo) {
    throw new Error('Подключите GitHub: укажите токен в разделе «Подключение»');
  }
  return publishToGithub({ ...cfg, siteJson, productsJson, extraFiles });
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
