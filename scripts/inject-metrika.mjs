import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const files = [
  'index.html',
  'catalog.html',
  'cart.html',
  'product.html',
  'pages/about.html',
  'pages/contacts.html',
  'pages/delivery.html',
  'pages/faq.html',
  'pages/guarantee.html',
  'pages/news.html',
  'pages/offer.html',
  'pages/privacy.html',
  'pages/production.html',
  'pages/where-to-buy.html',
  'pages/wholesale.html',
];

const snippet = `
  <!-- Yandex.Metrika counter -->
  <script type="text/javascript">
    (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=110505340', 'ym');

    ym(110505340, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
  </script>
  <noscript><div><img src="https://mc.yandex.ru/watch/110505340" style="position:absolute; left:-9999px;" alt=""></div></noscript>
  <!-- /Yandex.Metrika counter -->
`;

for (const rel of files) {
  const file = path.join(root, rel);
  const html = fs.readFileSync(file, 'utf8');
  if (html.includes('mc.yandex.ru/metrika/tag.js?id=110505340')) {
    console.log(`skip ${rel}`);
    continue;
  }
  fs.writeFileSync(file, html.replace('</head>', `${snippet}\n</head>`), 'utf8');
  console.log(`updated ${rel}`);
}
