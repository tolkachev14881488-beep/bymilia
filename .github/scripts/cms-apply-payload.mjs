import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const key = process.env.CMS_KEY || '';
const raw = process.env.PAYLOAD || '{}';
const payload = JSON.parse(raw);

if (!key || payload.key !== key) {
  console.error('Invalid CMS publish key');
  process.exit(1);
}

if (payload.siteJson) {
  writeFileSync('data/site.json', JSON.stringify(payload.siteJson, null, 2) + '\n');
}

if (payload.productsJson) {
  writeFileSync('data/products.json', JSON.stringify(payload.productsJson, null, 2) + '\n');
}

if (Array.isArray(payload.binaryFiles)) {
  for (const file of payload.binaryFiles) {
    if (!file?.path || !file?.base64) continue;
    mkdirSync(dirname(file.path), { recursive: true });
    writeFileSync(file.path, Buffer.from(file.base64, 'base64'));
  }
}
