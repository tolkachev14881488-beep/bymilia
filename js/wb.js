/** URL фото и данные с Wildberries (card.wb.ru API) */

const BASKET_RANGES = [
  [0, 143, '01'],
  [144, 287, '02'],
  [288, 431, '03'],
  [432, 575, '04'],
  [576, 719, '05'],
  [720, 863, '06'],
  [864, 1007, '07'],
  [1008, 1151, '08'],
  [1152, 1295, '09'],
  [1296, 1439, '10'],
  [1440, 1583, '11'],
  [1584, 1727, '12'],
  [1728, 1871, '13'],
  [1872, 2015, '14'],
  [2016, 2159, '15'],
  [2160, 2303, '16'],
  [2304, 2447, '17'],
  [2448, 2591, '18'],
];

const WB_API = 'https://card.wb.ru/cards/v4/detail?appType=1&curr=byn&dest=-59208&nm=';

const COLOR_HEX = {
  черный: '#1c1c1c',
  белый: '#f5f5f0',
  розовый: '#f48fb1',
  красный: '#e53935',
  желтый: '#ffca28',
  оранжевый: '#ff5500',
  голубой: '#4fc3f7',
  синий: '#3d5afe',
  фиолетовый: '#9c27b0',
};

const CATALOG_LABELS = {
  230183062: { id: 'wb-black', colorName: 'Чёрный', colorHex: '#1c1c1c' },
  216515622: { id: 'wb-tropical', colorName: 'Тропический принт', colorHex: '#4fc3f7' },
  471902869: { id: 'wb-bright', colorName: 'Яркий принт', colorHex: '#ffca28' },
  216496169: { id: 'wb-classic', colorName: 'Классика · 5 цветов', colorHex: '#ff5500' },
};

function basketHost(vol) {
  for (const [from, to, host] of BASKET_RANGES) {
    if (vol >= from && vol <= to) return host;
  }
  return '14';
}

export function wbImageUrl(nm, photoIndex = 1, size = 'c516x688') {
  const vol = Math.floor(nm / 100000);
  const part = Math.floor(nm / 1000);
  const host = basketHost(vol);
  return `https://basket-${host}.wbbasket.ru/vol${vol}/part${part}/${nm}/images/${size}/${photoIndex}.webp`;
}

/** Подбирает рабочий URL фото (перебор basket-01…24) */
export async function resolveWbImageUrl(nm, photoIndex = 1) {
  const vol = Math.floor(nm / 100000);
  const part = Math.floor(nm / 1000);
  const sizes = ['c516x688', 'big', 'tm'];
  const hosts = Array.from({ length: 24 }, (_, i) => String(i + 1).padStart(2, '0'));

  const tryLoad = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.onload = () => resolve(url);
      img.onerror = () => resolve(null);
      img.src = url;
    });

  for (const host of hosts) {
    for (const size of sizes) {
      const url = `https://basket-${host}.wbbasket.ru/vol${vol}/part${part}/${nm}/images/${size}/${photoIndex}.webp`;
      const ok = await tryLoad(url);
      if (ok) return ok;
    }
  }
  return '';
}

function primaryHex(colors = []) {
  const name = colors[0]?.name?.toLowerCase();
  return COLOR_HEX[name] || '#ff5500';
}

export async function fetchWbProduct(nm) {
  const res = await fetch(`${WB_API}${nm}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`WB API ${res.status}`);
  const data = await res.json();
  const p = data.products?.[0];
  if (!p) throw new Error('Товар не найден на WB');
  const priceBlock = p.sizes?.[0]?.price || {};
  const price = Math.round((priceBlock.product || 0) / 100);
  const oldPrice = Math.round((priceBlock.basic || 0) / 100);
  const meta = CATALOG_LABELS[nm] || {
    id: `wb-${nm}`,
    colorName: p.name || `Артикул ${nm}`,
    colorHex: primaryHex(p.colors),
  };
  return {
    id: meta.id,
    colorName: meta.colorName,
    colorHex: meta.colorHex,
    price,
    oldPrice: oldPrice > price ? oldPrice : null,
    skuPrefix: `BM-${nm}`,
    image: await resolveWbImageUrl(nm, 1),
    wbNm: nm,
    wbUrl: `https://www.wildberries.by/catalog/${nm}/detail.aspx`,
    wbPhoto: 1,
    published: true,
    description:
      'Сапожки для разогрева By Milia — согревают стопы перед занятием, на репетиции и между номерами. Мягкий флис, удобная посадка, производство в Минске.',
    features: [
      '6 размеров · 25–42 см',
      `Расцветки на WB: ${(p.colors || []).map((c) => c.name).join(', ') || 'см. карточку'}`,
      `${p.feedbacks || 0} отзывов · рейтинг ${p.reviewRating || p.rating || '—'}`,
      'Заказ на сайте или на Wildberries',
    ],
    wbRaw: {
      name: p.name,
      brand: p.brand,
      feedbacks: p.feedbacks,
      rating: p.reviewRating || p.rating,
      colors: p.colors,
    },
  };
}

export async function fetchWbCatalog(urls) {
  const ids = urls.map((u) => {
    const m = String(u).match(/catalog\/(\d+)/);
    if (!m) throw new Error(`Неверная ссылка: ${u}`);
    return Number(m[1]);
  });
  const products = [];
  for (const nm of ids) {
    products.push(await fetchWbProduct(nm));
  }
  return products;
}

export const DEFAULT_WB_URLS = [
  'https://www.wildberries.by/catalog/230183062/detail.aspx',
  'https://www.wildberries.by/catalog/216515622/detail.aspx',
  'https://www.wildberries.by/catalog/471902869/detail.aspx',
  'https://www.wildberries.by/catalog/216496169/detail.aspx',
];
