import { SIZES } from './config.js';

const BASE_DESCRIPTION = `Премиальные сапожки By Milia для разогрева стоп перед занятием и между номерами. Мягко удерживают тепло и не стесняют движения в зале.

Снаружи используется плотная износостойкая ткань, внутри — мягкий флис и утеплитель. Подошва гибкая, с мягкой вставкой для изоляции от холодного пола.

Подходят для гимнастики, хореографии, балета и танцев. Можно надевать на носки, босую ногу, пуанты или балетки. Рекомендуем деликатную стирку до 40 °C.`;

const COMMON_FEATURES = [
  'Состав: экокожа, флис, синтепон, плащевая ткань',
  'Стелька ЭВА, гибкая нескользящая подошва',
  'Застежка: резинка, комфортная посадка',
  '6 размеров: 25–27, 28–30, 31–33, 34–36, 37–39, 40–42',
  'Производство: Беларусь, г. Минск',
];

export const PRODUCTS = [
  {
    id: 'black',
    colorName: 'Черный',
    colorHex: '#1c1c1c',
    subtitle: 'Классика для тренировок и выступлений',
    skuPrefix: 'BM-BLK',
    price: 72,
    oldPrice: 88,
    image: null,
    description: BASE_DESCRIPTION,
    features: COMMON_FEATURES,
  },
  {
    id: 'pink',
    colorName: 'Розовый',
    colorHex: '#f48fb1',
    subtitle: 'Нежный оттенок для юных танцовщиц',
    skuPrefix: 'BM-PNK',
    price: 72,
    oldPrice: 88,
    image: null,
    description: BASE_DESCRIPTION,
    features: COMMON_FEATURES,
  },
  {
    id: 'red',
    colorName: 'Красный',
    colorHex: '#e53935',
    subtitle: 'Выразительный цвет для сцены',
    skuPrefix: 'BM-RED',
    price: 74,
    oldPrice: 90,
    image: null,
    description: BASE_DESCRIPTION,
    features: COMMON_FEATURES,
  },
  {
    id: 'yellow',
    colorName: 'Желтый',
    colorHex: '#ffca28',
    subtitle: 'Солнечный акцент в раздевалке',
    skuPrefix: 'BM-YEL',
    price: 72,
    oldPrice: 88,
    image: null,
    description: BASE_DESCRIPTION,
    features: COMMON_FEATURES,
  },
  {
    id: 'white',
    colorName: 'Белый',
    colorHex: '#f5f5f0',
    subtitle: 'Легкий светлый образ для коллектива',
    skuPrefix: 'BM-WHT',
    price: 72,
    oldPrice: 88,
    image: null,
    description: BASE_DESCRIPTION,
    features: COMMON_FEATURES,
  },
];

export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}

export function sku(product, sizeId) {
  return `${product.skuPrefix}-${sizeId}`;
}

export { SIZES };
