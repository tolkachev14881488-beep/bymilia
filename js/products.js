import { SIZES } from './config.js';
import { wbImageUrl } from './wb.js';

/** Данные с Wildberries: артикул 216496169 */
export const WB_PRODUCT = {
  nm: 216496169,
  articul: '216496169',
  name: 'Сапожки для разогрева чуни танцевальные',
  brand: 'by Milia',
  url: 'https://www.wildberries.by/catalog/216496169/detail.aspx',
  rating: 4.9,
  reviews: 753,
  price: 2241,
  oldPrice: 4500,
};

const DESCRIPTION = `Новинка! Премиальные сапожки для разогрева от белорусского бренда By Milia. Улучшают кровообращение, обеспечивают согревающий эффект и поддерживают мышцы в тонусе.

Чуни подходят для гимнастики, танцев, балета — между тренировками, на занятиях и репетициях. Снаружи плотный материал, не пропускает влагу. Подошва из прочной экокожи, вставка из вспененного материала изолирует от холодного пола. Внутри мягкий флис и синтепон 300 г/м².

Можно надевать на носки, босые ноги, пуанты или балетки — ориентируйтесь на длину стопы по размерной сетке. Стирка в деликатном режиме до 40 °C.

Производитель: ООО «АР-ВИАМ», г. Минск, ул. Панченко, 8.`;

const FEATURES = [
  'Состав: экокожа, флис, синтепон, плащевая ткань',
  'Стелька ЭВА, подошва — искусственная кожа',
  'Застёжка на резинке, гибкая нескользящая подошва',
  'Беларусь · 6 размеров 25–42 см',
  `${WB_PRODUCT.reviews} отзывов на Wildberries · ${WB_PRODUCT.rating} ★`,
];

/** Расцветки = фото 1–5 на WB */
export const PRODUCTS = [
  {
    id: 'black',
    colorName: 'Чёрный',
    colorHex: '#1c1c1c',
    wbPhoto: 1,
    skuPrefix: 'BM-216496169-BLK',
    description: DESCRIPTION,
    features: FEATURES,
  },
  {
    id: 'pink',
    colorName: 'Розовый',
    colorHex: '#f48fb1',
    wbPhoto: 2,
    skuPrefix: 'BM-216496169-PNK',
    description: DESCRIPTION,
    features: FEATURES,
  },
  {
    id: 'red',
    colorName: 'Красный',
    colorHex: '#e53935',
    wbPhoto: 3,
    skuPrefix: 'BM-216496169-RED',
    description: DESCRIPTION,
    features: FEATURES,
  },
  {
    id: 'yellow',
    colorName: 'Жёлтый',
    colorHex: '#ffca28',
    wbPhoto: 4,
    skuPrefix: 'BM-216496169-YEL',
    description: DESCRIPTION,
    features: FEATURES,
  },
  {
    id: 'white',
    colorName: 'Белый',
    colorHex: '#f5f5f0',
    wbPhoto: 5,
    skuPrefix: 'BM-216496169-WHT',
    description: DESCRIPTION,
    features: FEATURES,
  },
].map((p) => ({
  ...p,
  price: WB_PRODUCT.price,
  oldPrice: WB_PRODUCT.oldPrice,
  image: wbImageUrl(WB_PRODUCT.nm, p.wbPhoto),
  wbUrl: WB_PRODUCT.url,
}));

export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}

export function sku(product, sizeId) {
  return `${product.skuPrefix}-${sizeId}`;
}

export { SIZES };
