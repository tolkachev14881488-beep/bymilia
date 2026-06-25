import { getHomepage, getPublishedProducts } from './data-store.js';
import { asset, pageHref } from './layout.js';
import { applySeo } from './seo.js';
function heroPaletteLabel(product) {
  const label = String(product.paletteLabel || product.colorName || '').trim();
  return label.replace(/^Сапожки для разогрева\s*/i, '').replace(/"/g, '');
}

export function renderHomepage() {
  const hp = getHomepage();
  const hero = hp?.hero;
  if (!hero?.titleHtml?.trim() && !hero?.lead?.trim()) return;

  setHtml('[data-home="hero-eyebrow"]', hero.eyebrow);
  setHtml('[data-home="hero-title"]', hero.titleHtml);
  setHtml('[data-home="hero-lead"]', hero.lead);
  setText('[data-home="hero-card-label"]', hero.cardLabel);
  setText('[data-home="hero-card-sub"]', hero.cardSub);

  const heroImg = document.querySelector('[data-home="hero-image"]');
  if (heroImg) {
    if (hero.imageAlt) heroImg.alt = hero.imageAlt;
    const src = (hero.heroImage || '').trim();
    if (src) {
      heroImg.src = src.startsWith('http') ? src : asset(src);
    }
  }

  const statsEl = document.querySelector('[data-home="hero-stats"]');
  if (statsEl && hero.stats?.length) {
    statsEl.innerHTML = hero.stats
      .map(
        (s) =>
          `<li><strong>${escapeHtml(s.value)}</strong><span>${escapeHtml(s.label)}</span></li>`,
      )
      .join('');
  }

  const tagsEl = document.querySelector('[data-home="hero-tags"]');
  if (tagsEl && hero.tags?.length) {
    tagsEl.innerHTML = hero.tags
      .map((t) => `<span class="tag"><span class="tag-dot"></span>${escapeHtml(t)}</span>`)
      .join('');
  }

  const paletteEl = document.querySelector('[data-home="palette"]');
  if (paletteEl) {
    const paletteItems = hero.palette?.length
      ? hero.palette
      : getPublishedProducts().map((p) => ({
          label: heroPaletteLabel(p),
          color: p.colorHex,
        }));
    paletteEl.innerHTML = paletteItems
      .map(
        (item) =>
          `<span class="palette-dot"><span style="background:${escapeHtml(item.color)}"></span>${escapeHtml(item.label)}</span>`,
      )
      .join('');
  }

  const marqueeEl = document.querySelector('[data-home="marquee"]');
  if (marqueeEl && hp.marquee?.length) {
    const items = [...hp.marquee, ...hp.marquee];
    marqueeEl.innerHTML = items.map((w) => `<span>${escapeHtml(w)}</span>`).join('');
  }

  const bentoEl = document.querySelector('[data-home="bento"]');
  if (bentoEl && hp.bento?.length) {
    bentoEl.innerHTML = hp.bento
      .map(
        (card) => {
          const stars = card.stars
            ? `<div class="bento-stars" aria-label="5 из 5">★★★★★</div>`
            : '';
          return `
      <article class="bento-card bento-${card.variant || 'small'}">
        ${stars}
        <span class="bento-num">${escapeHtml(card.num || '')}</span>
        <h3>${escapeHtml(card.title || '')}</h3>
        <p>${escapeHtml(card.text || '')}</p>
      </article>`;
        },
      )
      .join('');
  }

  const steps = hp.steps;
  if (steps) {
    setText('[data-home="steps-eyebrow"]', steps.eyebrow);
    setText('[data-home="steps-title"]', steps.title);
    const stepsLead = document.querySelector('[data-home="steps-lead"]');
    if (stepsLead) {
      if (steps.lead?.trim()) {
        stepsLead.textContent = steps.lead;
        stepsLead.hidden = false;
      } else {
        stepsLead.hidden = true;
        stepsLead.textContent = '';
      }
    }
    const stepsGrid = document.querySelector('[data-home="steps-grid"]');
    if (stepsGrid && steps.items?.length) {
      stepsGrid.innerHTML = steps.items
        .map(
          (item, i) => `
        <article class="step-card reveal reveal-delay-${Math.min(i + 1, 3)}">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.text)}</p>
        </article>`,
        )
        .join('');
    }
  }

  const cat = hp.catalogSection;
  if (cat) {
    setText('[data-home="catalog-eyebrow"]', cat.eyebrow);
    setText('[data-home="catalog-title"]', cat.title);
    const leadEl = document.querySelector('[data-home="catalog-lead"]');
    if (leadEl) {
      const lead = (cat.lead || '').trim();
      if (lead) {
        leadEl.textContent = lead;
        leadEl.hidden = false;
      } else {
        leadEl.textContent = '';
        leadEl.hidden = true;
      }
    }
  }

  const ben = hp.benefits;
  if (ben) {
    setText('[data-home="benefits-eyebrow"]', ben.eyebrow);
    setText('[data-home="benefits-title"]', ben.title);
    setText('[data-home="benefits-lead"]', ben.lead);
    const section = document.querySelector('.section-benefits');
    if (section && ben.bgImage) {
      section.style.setProperty('--benefits-bg', `url("${asset(ben.bgImage)}")`);
      section.style.setProperty(
        '--benefits-bg-opacity',
        String(ben.bgOpacity != null ? ben.bgOpacity : 0.14),
      );
    }
    const cardsEl = document.querySelector('[data-home="benefits-cards"]');
    if (cardsEl && ben.cards?.length) {
      cardsEl.innerHTML = ben.cards
        .map(
          (c, i) => `
        <article class="info-card reveal reveal-delay-${Math.min(i + 1, 4)}">
          <span class="info-icon" aria-hidden="true">${escapeHtml(c.icon || '✦')}</span>
          <h3>${escapeHtml(c.title)}</h3>
          <p>${escapeHtml(c.text)}</p>
        </article>`,
        )
        .join('');
    }
  }

  const cta = hp.cta;
  if (cta) {
    setText('[data-home="cta-title"]', cta.title);
    setText('[data-home="cta-text"]', cta.text);
  }

  const seo = hp.seo;
  if (seo) {
    applySeo({
      title:
        seo.metaTitle ||
        'Сапожки для разогрева стоп By Milia — купить в Минске, доставка по Беларуси',
      description:
        seo.metaDescription ||
        'Сапожки для разогрева стоп By Milia для балета и танцев: 4 расцветки, размеры 25–42 см, производство в Минске. Розница и опт.',
      path: 'index.html',
      image: seo.ogImage ? asset(seo.ogImage) : undefined,
    });
    setText('[data-home="seo-title"]', seo.title);
    setHtml('[data-home="seo-html"]', seo.html);
  }

  import('./motion.js').then(({ observeReveals }) => {
    document.querySelectorAll('[data-home="bento"], [data-home="steps-grid"], [data-home="benefits-cards"]').forEach(observeReveals);
  });
}

function setText(sel, text) {
  const el = document.querySelector(sel);
  if (el && text != null) el.textContent = text;
}

function setHtml(sel, html) {
  const el = document.querySelector(sel);
  if (el && html != null) el.innerHTML = html;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
