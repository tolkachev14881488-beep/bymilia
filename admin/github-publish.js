const GITHUB_SETTINGS_KEY = 'bymilia-github';

export function loadGithubSettings() {
  try {
    return JSON.parse(localStorage.getItem(GITHUB_SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveGithubSettings(settings) {
  localStorage.setItem(GITHUB_SETTINGS_KEY, JSON.stringify(settings));
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

async function putFile({ token, owner, repo, path, branch, content, message, sha }) {
  const body = {
    message,
    content: toBase64Utf8(content),
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
export async function publishToGithub({ token, owner, repo, branch, siteJson, productsJson }) {
  const files = [
    { path: 'data/site.json', content: JSON.stringify(siteJson, null, 2) + '\n' },
    { path: 'data/products.json', content: JSON.stringify(productsJson, null, 2) + '\n' },
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
