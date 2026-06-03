import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = path.join(root, 'index.html');

let html = execSync('git show HEAD:index.html', { cwd: root, encoding: 'utf8' });

const oldBlock = `<div class="container hero-grid">
        <div class="hero-copy reveal">
          <span class="eyebrow" data-home="hero-eyebrow">Производство в Минске · для балета и танцев</span>
          <h1 id="hero-heading" data-home="hero-title">Сапожки для разогрева <em>By Milia</em></h1>
          <p class="lead hero-lead" data-home="hero-lead">Уютные сапожки согревают ножки перед занятием, на репетиции и между номерами. Четыре яркие расцветки, полный размерный ряд — заказ на сайте или на Wildberries.</p>
          <div class="hero-actions">
            <a class="btn btn-primary btn-glow btn-lg" href="catalog.html">Смотреть каталог</a>
            <a class="btn btn-ghost btn-lg" href="pages/wholesale.html">Опт для коллективов</a>
          </div>
          <ul class="hero-stats" data-home="hero-stats"></ul>
          <div class="palette-strip" data-home="palette"></div>
          <div class="hero-tags" data-home="hero-tags"></div>
        </div>
        <div class="hero-visual reveal reveal-delay-2">
          <div class="hero-photo-frame">
            <img class="hero-photo" data-home="hero-image" src="assets/products/hero-bright.png" alt="Сапожки для разогрева By Milia, яркий принт" width="520" height="640" fetchpriority="high">
            <div class="hero-photo-badge">
              <span class="hero-photo-badge-title" data-home="hero-card-label">By Milia</span>
              <span class="hero-photo-badge-sub" data-home="hero-card-sub">Своё производство · Минск</span>
            </div>
          </div>
        </div>
      </div>`;

const newBlock = `<div class="container hero-grid">
        <div class="hero-intro reveal is-visible">
          <span class="eyebrow" data-home="hero-eyebrow">Производство в Минске · для балета и танцев</span>
          <h1 id="hero-heading" data-home="hero-title">Сапожки для разогрева <em>By Milia</em></h1>
          <p class="lead hero-lead" data-home="hero-lead">Уютные сапожки согревают ножки перед занятием, на репетиции и между номерами. Четыре яркие расцветки, полный размерный ряд — заказ на сайте или на Wildberries.</p>
        </div>
        <div class="hero-visual reveal is-visible">
          <div class="hero-photo-frame">
            <img class="hero-photo" data-home="hero-image" src="assets/products/hero-bright.png" alt="Сапожки для разогрева By Milia, яркий принт" width="520" height="640" fetchpriority="high">
            <div class="hero-photo-badge">
              <span class="hero-photo-badge-title" data-home="hero-card-label">By Milia</span>
              <span class="hero-photo-badge-sub" data-home="hero-card-sub">Своё производство · Минск</span>
            </div>
          </div>
        </div>
        <div class="hero-body reveal is-visible">
          <div class="hero-actions">
            <a class="btn btn-primary btn-glow btn-lg" href="catalog.html">Смотреть каталог</a>
            <a class="btn btn-ghost btn-lg" href="pages/wholesale.html">Опт для коллективов</a>
          </div>
          <ul class="hero-stats" data-home="hero-stats"></ul>
          <div class="palette-strip" data-home="palette"></div>
          <div class="hero-tags" data-home="hero-tags"></div>
        </div>
      </div>`;

if (!html.includes(oldBlock)) {
  console.error('Hero block not found in git HEAD index.html');
  process.exit(1);
}

html = html.replace(oldBlock, newBlock);
fs.writeFileSync(indexPath, html, 'utf8');
console.log('Hero mobile structure fixed in index.html (UTF-8 from git)');
