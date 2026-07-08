/**
 * Live-тесты production-сайта by-milia.by (HTTP + содержимое).
 * Запуск: node scripts/live-site-test.mjs [https://by-milia.by]
 */
const BASE = (process.argv[2] || process.env.SITE_URL || 'https://by-milia.by').replace(/\/$/, '');
const TIMEOUT_MS = Number(process.env.LIVE_TEST_TIMEOUT_MS || 15000);
const SLOW_MS = Number(process.env.LIVE_TEST_SLOW_MS || 4000);

let failed = 0;
const warnings = [];

function ok(label) {
  console.log(`  OK ${label}`);
}

function fail(label, detail) {
  failed += 1;
  console.error(`  FAIL ${label}: ${detail}`);
}

function warn(label, detail) {
  warnings.push(`${label}: ${detail}`);
  console.log(`  WARN ${label}: ${detail}`);
}

async function fetchText(path, { accept = '*/*' } = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const started = Date.now();
  const res = await fetch(url, {
    headers: { Accept: accept },
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const elapsed = Date.now() - started;
  const text = await res.text();
  return { url, res, text, elapsed };
}

function parseSitemapLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

const HTML_PAGES = [
  {
    path: '/',
    label: 'главная',
    must: ['site-header', 'init.js', 'hero-grid', 'By Milia', 'width=device-width', 'data-site-root'],
    canonical: `${BASE}/`,
  },
  {
    path: '/catalog.html',
    label: 'каталог',
    must: ['product-grid', 'page-catalog', 'init.js'],
    canonical: `${BASE}/catalog.html`,
  },
  {
    path: '/cart.html',
    label: 'корзина',
    must: ['page-cart', 'cart-layout', 'name="phone"', 'name="email"', 'required'],
    canonical: `${BASE}/cart.html`,
  },
  {
    path: '/product.html?id=wb-black',
    label: 'товар wb-black',
    must: ['product-root', 'init.js'],
  },
  {
    path: '/pages/about.html',
    label: 'о нас',
    must: ['page-hero', 'page-content', 'data-site-root=".."'],
  },
  {
    path: '/pages/contacts.html',
    label: 'контакты',
    must: ['page-hero', 'page-content'],
  },
  {
    path: '/pages/wholesale.html',
    label: 'опт',
    must: ['page-wholesale', 'page-content'],
  },
];

const STATIC_ASSETS = [
  '/css/styles.css',
  '/js/init.js',
  '/js/layout.js',
  '/js/products.js',
  '/js/cart.js',
  '/assets/logo.png',
];

console.log(`\n=== Live site tests: ${BASE} ===\n`);

console.log('--- Доступность страниц ---');
for (const page of HTML_PAGES) {
  try {
    const { res, text, elapsed, url } = await fetchText(page.path, { accept: 'text/html' });
    if (res.status !== 200) {
      fail(page.label, `${url} → HTTP ${res.status}`);
      continue;
    }
    ok(`${page.label} (${res.status}, ${elapsed}ms)`);
    if (elapsed > SLOW_MS) warn('медленный ответ', `${page.path} — ${elapsed}ms`);

    for (const needle of page.must) {
      if (!text.includes(needle)) fail(page.label, `нет «${needle}»`);
    }
    if (page.canonical && !text.includes(`href="${page.canonical}"`)) {
      fail(page.label, `canonical не ${page.canonical}`);
    }
    if (text.includes('github.io/bymilia')) {
      fail(page.label, 'остался URL GitHub Pages');
    }
    if (!text.includes('styles.css?v=')) {
      fail(page.label, 'нет cache-bust styles.css?v=');
    }
  } catch (err) {
    fail(page.label, err.message || String(err));
  }
}

console.log('\n--- Sitemap ---');
try {
  const { res, text } = await fetchText('/sitemap.xml');
  if (res.status !== 200) fail('sitemap.xml', `HTTP ${res.status}`);
  else {
    ok('sitemap.xml доступен');
    const locs = parseSitemapLocs(text);
    if (locs.length < 10) fail('sitemap', `мало URL (${locs.length})`);
    else ok(`sitemap: ${locs.length} URL`);

    for (const loc of locs) {
      if (!loc.startsWith(`${BASE}/`) && loc !== `${BASE}/`) {
        fail('sitemap domain', loc);
        continue;
      }
      try {
        const { res: pageRes, elapsed } = await fetchText(loc);
        if (pageRes.status !== 200) fail('sitemap URL', `${loc} → ${pageRes.status}`);
        else ok(`sitemap ${loc.replace(BASE, '') || '/'} (${elapsed}ms)`);
      } catch (err) {
        fail('sitemap URL', `${loc}: ${err.message}`);
      }
    }
  }
} catch (err) {
  fail('sitemap.xml', err.message || String(err));
}

console.log('\n--- robots.txt ---');
try {
  const { res, text } = await fetchText('/robots.txt');
  if (res.status !== 200) fail('robots.txt', `HTTP ${res.status}`);
  else {
    ok('robots.txt доступен');
    if (!text.includes(`Sitemap: ${BASE}/sitemap.xml`)) fail('robots', 'нет ссылки на sitemap');
    else ok('robots → sitemap');
    if (!text.includes('Disallow: /admin/')) warn('robots', 'нет Disallow: /admin/');
    else ok('robots закрывает /admin/');
  }
} catch (err) {
  fail('robots.txt', err.message || String(err));
}

console.log('\n--- JSON data ---');
let liveProducts = [];
try {
  const { res, text } = await fetchText('/data/site.json', { accept: 'application/json' });
  if (res.status !== 200) fail('site.json', `HTTP ${res.status}`);
  else {
    const site = JSON.parse(text);
    if (site.site?.brand !== 'By Milia') fail('site.json', `brand=${site.site?.brand}`);
    else ok('site.json brand By Milia');
    const pageCount = Object.keys(site.pages || {}).length;
    if (pageCount < 5) fail('site.json', `pages=${pageCount}`);
    else ok(`site.json pages (${pageCount})`);
    if (!site.contacts?.email?.includes('bymilia')) fail('site.json', 'contacts.email');
    else ok('site.json contacts.email');
    if (!site.homepage?.hero?.titleHtml && !site.homepage?.hero?.lead) {
      fail('site.json', 'homepage hero пустой');
    } else ok('site.json homepage hero');
  }
} catch (err) {
  fail('site.json', err.message || String(err));
}

try {
  const { res, text } = await fetchText('/data/products.json', { accept: 'application/json' });
  if (res.status !== 200) fail('products.json', `HTTP ${res.status}`);
  else {
    const data = JSON.parse(text);
    liveProducts = (data.products || []).filter((p) => p.published !== false);
    if (liveProducts.length < 4) fail('products.json', `опубликовано ${liveProducts.length}`);
    else ok(`products.json (${liveProducts.length} товаров)`);
    for (const id of ['wb-black', 'wb-tropical', 'wb-bright', 'wb-classic']) {
      if (!liveProducts.some((p) => p.id === id)) fail('products.json', `нет ${id}`);
    }
    ok('products.json wb-* ids');
    for (const p of liveProducts) {
      if (!p.price || p.price <= 0) fail('product price', `${p.id}`);
      if (!p.image && !(p.images || []).length) fail('product image', `${p.id} без фото`);
    }
    ok('products.json цены и фото');
  }
} catch (err) {
  fail('products.json', err.message || String(err));
}

console.log('\n--- Статические ресурсы ---');
for (const asset of STATIC_ASSETS) {
  try {
    const { res, elapsed } = await fetchText(asset);
    if (res.status !== 200) fail('asset', `${asset} → ${res.status}`);
    else ok(`${asset} (${elapsed}ms)`);
  } catch (err) {
    fail('asset', `${asset}: ${err.message}`);
  }
}

console.log('\n--- Фото товаров ---');
const checkedImages = new Set();
for (const p of liveProducts) {
  const imgs = [p.image, ...(p.images || [])].filter(Boolean);
  for (const img of imgs) {
    if (checkedImages.has(img)) continue;
    checkedImages.add(img);
    const path = img.startsWith('http') ? img : `/${img.replace(/^\.\//, '')}`;
    try {
      const { res } = await fetchText(path);
      if (res.status !== 200) fail('product image', `${path} → ${res.status}`);
      else ok(`image ${path.replace(/^\//, '')}`);
    } catch (err) {
      fail('product image', `${path}: ${err.message}`);
    }
  }
}

console.log('\n--- Админка (безопасность) ---');
try {
  const { res, text } = await fetchText('/admin/index.html', { accept: 'text/html' });
  if (res.status !== 200) warn('admin', `HTTP ${res.status} (может быть закрыт на хостинге)`);
  else {
    ok('admin/index.html отвечает');
    if (text.includes('bymilia2026') || /пароль.*123/i.test(text)) {
      fail('admin security', 'подсказка пароля в HTML');
    } else ok('admin без подсказки пароля');
    if (!text.includes('noindex')) fail('admin seo', 'нет noindex');
    else ok('admin noindex');
    if (!text.includes('login-form')) fail('admin', 'нет формы входа');
    else ok('admin login-form');
  }
} catch (err) {
  warn('admin', err.message || String(err));
}

if (warnings.length) {
  console.log(`\n--- Предупреждения (${warnings.length}) ---`);
  for (const w of warnings) console.log(`  • ${w}`);
}

console.log(failed ? `\n${failed} live test(s) failed` : '\nAll live site checks passed');
process.exit(failed ? 1 : 0);
