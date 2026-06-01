import { execSync } from 'child_process';
import { CMS_PUBLISH_KEY } from '../admin/cms-config.js';

function getGitHubToken() {
  const input = 'protocol=https\nhost=github.com\n\n';
  const out = execSync('git credential fill', { input, encoding: 'utf8' });
  for (const line of out.split('\n')) {
    if (line.startsWith('password=')) return line.slice(9).trim();
  }
  throw new Error('GitHub login not found. Open GitHub Desktop or run git pull once.');
}

const token = getGitHubToken();
const setupUrl = `https://tolkachev14881488-beep.github.io/bymilia/admin/#cms_key=${CMS_PUBLISH_KEY}&gh_token=${encodeURIComponent(token)}`;

execSync(`start "" "${setupUrl}"`, { stdio: 'ignore', shell: true });
console.log('Admin opened — log in with bymilia2026. Publishing is configured.');
