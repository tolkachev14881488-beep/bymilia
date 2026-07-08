import { execSync } from 'child_process';
import { CMS_PUBLISH_KEY } from '../admin/cms-config.js';

const SITE_ADMIN_URL = process.env.ADMIN_SETUP_URL || 'https://by-milia.by/admin/';

function getGitHubToken() {
  try {
    return execSync('gh auth token', { encoding: 'utf8' }).trim();
  } catch {
    const input = 'protocol=https\nhost=github.com\n\n';
    const out = execSync('git credential fill', { input, encoding: 'utf8' });
    for (const line of out.split('\n')) {
      if (line.startsWith('password=')) return line.slice(9).trim();
    }
    throw new Error('GitHub login not found. Run: gh auth login');
  }
}

const token = getGitHubToken();
const setupUrl = `${SITE_ADMIN_URL}#cms_key=${CMS_PUBLISH_KEY}&gh_token=${encodeURIComponent(token)}`;

execSync(`start "" "${setupUrl}"`, { stdio: 'ignore', shell: true });
console.log(`Admin opened: ${SITE_ADMIN_URL}`);
console.log('Publishing is configured. Password: bymilia2026');
