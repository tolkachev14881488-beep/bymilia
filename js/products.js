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
    colorName: 'Нежно-розовый',
    colorHex: '#f4a5b8',
    price: 42,
    skuPrefix: 'BM-ROS',
    description:
      'Нежный оттенок для юных танцовщиц. Согревают стопы и создают уют перед выходом на сцену.',
    features: ['6 размеров', 'Популярный цвет в коллективах', 'Стирка по инструкции на бирке'],
  },
  {
    id: 'raspberry',
    colorName: 'Малиновый',
    colorHex: '#c9185b',
    price: 44,
    skuPrefix: 'BM-RAS',
    description:
      'Яркий фирменный оттенок By Milia. Хорошо видны в раздевалке — не перепутаешь с чужой парой.',
    features: ['6 размеров', 'Фирменная расцветка', 'Отличный подарок к началу сезона'],
  },
  {
    id: 'lilac',
    colorName: 'Сиреневый',
    colorHex: '#9b7eb8',
    price: 42,
    skuPrefix: 'BM-LIL',
    description:
      'Спокойный сиреневый тон. Подходит для ежедневных тренировок и выступлений.',
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
