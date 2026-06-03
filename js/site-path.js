/** Базовый URL сайта (корректно на GitHub Pages /bymilia/ и локально) */

export function getSiteRoot() {
  const rootAttr = document.body?.dataset?.siteRoot;
  if (rootAttr) {
    return new URL(rootAttr, window.location.href).href;
  }

  const scripts = document.querySelectorAll('script[type="module"][src]');
  for (const el of scripts) {
    const src = el.getAttribute('src');
    if (!src || !/\/js\//.test(src)) continue;
    try {
      const scriptUrl = new URL(src, window.location.href);
      return new URL('../', scriptUrl).href;
    } catch {
      /* next */
    }
  }

  const path = window.location.pathname.replace(/\\/g, '/');
  const inPages = path.match(/^(.*)\/pages\/[^/]*$/);
  if (inPages) {
    const base = inPages[1] ? `${inPages[1]}/` : '/';
    return new URL(base, window.location.origin).href;
  }
  const dir = path.replace(/\/[^/]*$/, '') || '/';
  const withSlash = dir.endsWith('/') ? dir : `${dir}/`;
  return new URL(withSlash, window.location.origin).href;
}

export function dataFileUrl(filename) {
  return new URL(`data/${filename}`, getSiteRoot()).href;
}
