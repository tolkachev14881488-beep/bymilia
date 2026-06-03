/** Базовый URL сайта (корректно на GitHub Pages /bymilia/ и локально) */

export function getSiteRoot() {
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
  const pagesIdx = path.indexOf('/pages/');
  const rootPath = pagesIdx >= 0 ? path.slice(0, pagesIdx + 1) : path.replace(/[^/]*$/, '');
  return new URL(rootPath || '/', window.location.origin).href;
}

export function dataFileUrl(filename) {
  return new URL(`data/${filename}`, getSiteRoot()).href;
}
