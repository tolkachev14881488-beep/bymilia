import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = process.argv[2] || '19';

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fp);
    else if (entry.name.endsWith('.html')) {
      let html = fs.readFileSync(fp, 'utf8');
      if (!/styles\.css\?v=\d+/.test(html)) continue;
      html = html.replace(/styles\.css\?v=\d+/g, `styles.css?v=${version}`);
      fs.writeFileSync(fp, html, 'utf8');
    }
  }
}

walk(root);
console.log(`CSS cache bumped to v=${version}`);
