import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const commit = process.argv[2] || '4f7c21a';
const out = path.join(root, 'data', 'site.json');
const raw = execSync(`git show ${commit}:data/site.json`, { cwd: root, encoding: 'utf8' });
JSON.parse(raw);
writeFileSync(out, raw.endsWith('\n') ? raw : `${raw}\n`, 'utf8');
console.log(`Restored data/site.json from ${commit}`);
