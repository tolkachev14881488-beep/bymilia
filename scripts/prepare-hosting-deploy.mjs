/**
 * Собрать папку deploy/ для загрузки на hoster.by (FTP / файловый менеджер).
 *
 *   node scripts/prepare-hosting-deploy.mjs
 *   node scripts/prepare-hosting-deploy.mjs https://by-milia.by
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'deploy');

const domain = (process.argv[2] || 'https://by-milia.by').replace(/\/$/, '');
const oldOrigin = 'https://tolkachev14881488-beep.github.io/bymilia';

const COPY_DIRS = ['css', 'js', 'data', 'assets', 'pages', 'admin'];
const COPY_FILES = [
  'index.html',
  'catalog.html',
  'cart.html',
  'product.html',
  'robots.txt',
  'sitemap.xml',
  '.htaccess',
];

const SKIP_IN_COPY = new Set(['node_modules', '.git', 'deploy', 'scripts', '.cursor']);

function walkCopy(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (SKIP_IN_COPY.has(name)) continue;
    const from = path.join(src, name);
    const to = path.join(dest, name);
    const st = fs.statSync(from);
    if (st.isDirectory()) walkCopy(from, to);
    else {
      let text = fs.readFileSync(from, 'utf8');
      if (/\.(html|xml|txt|js|json|css)$/i.test(name)) {
        text = text.split(oldOrigin).join(domain);
      }
      fs.writeFileSync(to, text, 'utf8');
    }
  }
}

function writeRobots() {
  const body = `User-agent: *
Allow: /

Sitemap: ${domain}/sitemap.xml

Disallow: /admin/
Disallow: /cart.html
`;
  fs.writeFileSync(path.join(outDir, 'robots.txt'), body, 'utf8');
}

function writeSitemap() {
  const paths = [
    '/',
    '/catalog.html',
    '/pages/about.html',
    '/pages/delivery.html',
    '/pages/wholesale.html',
    '/pages/contacts.html',
    '/pages/faq.html',
    '/pages/privacy.html',
    '/pages/offer.html',
    '/pages/guarantee.html',
    '/pages/news.html',
    '/pages/production.html',
    '/pages/where-to-buy.html',
  ];
  const urls = paths
    .map(
      (p) => `  <url>
    <loc>${domain}${p === '/' ? '/' : p}</loc>
    <changefreq>${p === '/' || p === '/catalog.html' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${p === '/' ? '1.0' : p === '/catalog.html' ? '0.9' : '0.7'}</priority>
  </url>`,
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), xml, 'utf8');
}

if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const dir of COPY_DIRS) {
  const src = path.join(root, dir);
  if (fs.existsSync(src)) walkCopy(src, path.join(outDir, dir));
}

for (const file of COPY_FILES) {
  const src = path.join(root, file);
  if (!fs.existsSync(src)) continue;
  let text = fs.readFileSync(src, 'utf8');
  if (/\.(html|xml|txt|js|json|css)$/i.test(file)) {
    text = text.split(oldOrigin).join(domain);
  }
  fs.writeFileSync(path.join(outDir, file), text, 'utf8');
}

writeRobots();
writeSitemap();

console.log(`Готово: ${outDir}`);
console.log(`Домен в файлах: ${domain}`);
console.log('Загрузите в ISPmanager: www/by-milia.by/data (или public_html)');
