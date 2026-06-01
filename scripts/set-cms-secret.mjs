import { execSync } from 'child_process';
import crypto from 'crypto';

const owner = 'tolkachev14881488-beep';
const repo = 'bymilia';
const secretName = 'CMS_PUBLISH_KEY';

function getGitHubToken() {
  const input = 'protocol=https\nhost=github.com\n\n';
  const out = execSync('git credential fill', { input, encoding: 'utf8' });
  for (const line of out.split('\n')) {
    if (line.startsWith('password=')) return line.slice(9).trim();
  }
  throw new Error('GitHub token not found. Run: git pull (login in browser once).');
}

async function gh(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${url} → ${res.status}: ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

async function setRepoSecret(token, name, value) {
  const sodium = await import('libsodium-wrappers');
  await sodium.ready;
  const { key, key_id } = await gh(`https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`, token);
  const binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
  const enc = sodium.crypto_box_seal(sodium.from_string(value), binkey);
  const encrypted_value = sodium.to_base64(enc, sodium.base64_variants.ORIGINAL);
  await gh(`https://api.github.com/repos/${owner}/${repo}/actions/secrets/${name}`, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ encrypted_value, key_id }),
  });
}

const cmsKey = crypto.randomBytes(24).toString('hex');
const token = getGitHubToken();

await setRepoSecret(token, secretName, cmsKey);

const user = await gh('https://api.github.com/user', token);

console.log(`OK: secret ${secretName} set for ${owner}/${repo} (user ${user.login})`);
const setupUrl = `https://tolkachev14881488-beep.github.io/bymilia/admin/#cms_key=${cmsKey}&gh_token=${encodeURIComponent(token)}`;
try {
  execSync(`start "" "${setupUrl}"`, { stdio: 'ignore', shell: true });
  console.log('Browser opened with admin auto-setup.');
} catch {
  console.log('Open admin and log in — publishing is configured.');
}
