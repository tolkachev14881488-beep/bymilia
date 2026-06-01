import { SIZES } from './config.js';

/** Цены и описания — замените на актуальные с Wildberries / прайса */
export const PRODUCTS = [
  {
    id: 'black',
    colorName: 'Классический чёрный',
    colorHex: '#1c1c1c',
    price: 42,
    skuPrefix: 'BM-BLK',
    description:
      'Сапожки для разогрева стоп перед занятиями и между номерами. Мягкий верх, удобная посадка на ножку.',
    features: ['6 размеров', 'Для зала и репетиций', 'Легко надевать самостоятельно'],
  },
  {
    id: 'rose',
    colorName: 'Персиковый',
    colorHex: '#ffc9a8',
    price: 42,
    skuPrefix: 'BM-PCH',
    description:
      'Мягкий персиковый оттенок — тёплый и нежный. Идеален для юных танцовщиц и повседневных репетиций.',
    features: ['6 размеров', 'Популярный цвет в коллективах', 'Стирка по инструкции на бирке'],
  },
  {
    id: 'raspberry',
    colorName: 'Солнечный оранж',
    colorHex: '#ff7f00',
    price: 44,
    skuPrefix: 'BM-ORG',
    description:
      'Фирменный яркий оранж By Milia — как на golden hour. Хорошо видны в раздевалке, не перепутаешь с чужой парой.',
    features: ['6 размеров', 'Фирменная расцветка', 'Отличный подарок к началу сезона'],
  },
  {
    id: 'lilac',
    colorName: 'Терракотовый',
    colorHex: '#e86a3a',
    price: 42,
    skuPrefix: 'BM-TER',
    description:
      'Глубокий терракотовый тон — спокойный и стильный. Подходит для тренировок и выступлений.',
    features: ['6 размеров', 'Универсальный цвет', 'Производство By Milia, Минск'],
  },
];

export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}

export function sku(product, sizeId) {
  return `${product.skuPrefix}-${sizeId}`;
}

export { SIZES };
