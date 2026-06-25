/** Человекочитаемые названия страниц для клиента */
export const PAGE_LABELS = {
  about: 'О нас',
  delivery: 'Доставка и оплата',
  wholesale: 'Опт',
  production: 'Производство',
  contacts: 'Контакты',
  faq: 'Вопросы и ответы',
  guarantee: 'Гарантия и возврат',
  'where-to-buy': 'Где приобрести',
  news: 'Новости',
  offer: 'Публичная оферта',
  privacy: 'Конфиденциальность',
};

export function pageLabel(id) {
  return PAGE_LABELS[id] || id;
}
