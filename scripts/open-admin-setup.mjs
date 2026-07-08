import { execSync } from 'child_process';
import { CMS_PUBLISH_KEY } from '../admin/cms-config.js';

const SITE_ADMIN_URL = process.env.ADMIN_SETUP_URL || 'https://by-milia.by/admin/';
const setupUrl = `${SITE_ADMIN_URL}#cms_key=${CMS_PUBLISH_KEY}`;

execSync(`start "" "${setupUrl}"`, { stdio: 'ignore', shell: true });
console.log(`Admin opened: ${SITE_ADMIN_URL}`);
console.log('Direct publish to by-milia.by is configured. Password: bymilia2026');
