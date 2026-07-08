/** База знаний By Milia — автономная копия для ИИ-консультанта */

export const SITE = {
  brand: 'By Milia',
  tagline: 'Сапожки для разогрева стоп для танцев',
  siteUrl: 'https://by-milia.by',
  catalogUrl: 'https://by-milia.by/catalog.html',
  cartUrl: 'https://by-milia.by/cart.html',
  wholesaleUrl: 'https://by-milia.by/pages/wholesale.html',
  currency: 'BYN',
  currencyLabel: 'руб.',
};

export const CONTACTS = {
  phone: '+375 29 000-00-00',
  phoneRaw: '375290000000',
  email: 'orders@bymilia.by',
  whatsapp: '375290000000',
  address: 'г. Минск, ул. Панченко, 8 (самовывоз)',
  pickupHours: '11:00–18:00, пн–пт, по предварительной договорённости',
};

export const SIZE_CHART = {
  fitNote: 'Сапожки идут с запасом на свободу',
  importantNote:
    'Ориентируйтесь на длину стопы. Если будете надевать поверх балеток или пуантов — возьмите на размер больше',
  rows: [
    { size: '25–27', footLength: '16–18 см', insoleLength: '20 см', height: '21 см' },
    { size: '28–30', footLength: '18–20 см', insoleLength: '22 см', height: '21 см' },
    { size: '31–33', footLength: '20–22 см', insoleLength: '24 см', height: '22 см' },
    { size: '34–36', footLength: '22–24 см', insoleLength: '26 см', height: '23 см' },
    { size: '37–39', footLength: '24–26 см', insoleLength: '28 см', height: '24 см' },
    { size: '40–42', footLength: '26–28 см', insoleLength: '30 см', height: '25 см' },
  ],
};

export const PRODUCTS = [
  {
    id: 'wb-black',
    name: 'Чёрные',
    price: 72,
    oldPrice: 175,
    wbUrl: 'https://www.wildberries.by/catalog/230183062/detail.aspx',
    reviews: '670 отзывов · рейтинг 5',
  },
  {
    id: 'wb-tropical',
    name: 'Единорог',
    price: 77,
    oldPrice: 175,
    wbUrl: 'https://www.wildberries.by/catalog/216515622/detail.aspx',
    reviews: '200 отзывов · рейтинг 5',
  },
  {
    id: 'wb-bright',
    name: 'Упс',
    price: 77,
    oldPrice: 175,
    wbUrl: 'https://www.wildberries.by/catalog/471902869/detail.aspx',
    reviews: '62 отзыва · рейтинг 5',
  },
  {
    id: 'wb-classic',
    name: 'Цветы',
    price: 77,
    oldPrice: 175,
    wbUrl: 'https://www.wildberries.by/catalog/216496169/detail.aspx',
    reviews: '753 отзыва · рейтинг 4.9',
  },
];

export const DELIVERY = {
  orderHours: 'Пн–Вс 10:00–20:00, отправка на следующий день при наличии',
  sameDayNote: 'Заказы до 13:00 в рабочий день стараемся отгрузить в тот же день',
  options: [
    { id: 'pickup', label: 'Самовывоз (Минск, ул. Панченко, 8)', hint: 'Бесплатно' },
    { id: 'europost', label: 'Белпочта / Европочта по Беларуси', hint: 'Бесплатно от 80 руб., иначе от 6.34 руб.' },
    { id: 'courier_minsk', label: 'Курьер по Минску (Яндекс)', hint: 'Бесплатно от 400 руб.' },
    { id: 'courier_by', label: 'Курьер по Беларуси', hint: 'Бесплатно от 400 руб.' },
    { id: 'cdek_rf', label: 'СДЭК (Россия)', hint: 'Стоимость индивидуально' },
  ],
  wholesaleLeadDays: 14,
};

export const FAQ = [
  {
    q: 'Как выбрать размер?',
    a: 'Ориентируйтесь на длину стопы по таблице. При сомнении — напишите длину стопы в см, поможем подобрать. Поверх пуантов/балеток — берите на размер больше.',
  },
  {
    q: 'Можно ли стирать?',
    a: 'Да, деликатная стирка при низкой температуре, без агрессивного отбеливателя, сушить естественным образом.',
  },
  {
    q: 'Как быстро отправите?',
    a: 'При наличии размера — отправка на следующий день. Заказы до 13:00 часто уходят в тот же день.',
  },
  {
    q: 'Есть опт?',
    a: 'Да, от 10 пар для студий и коллективов. Индивидуальный расчёт, производство от 14 рабочих дней, предоплата 50%.',
  },
];

export const SPECS = [
  'Состав: экокожа, флис, синтепон, оксфорд',
  'Подкладка: флис',
  'Стелька: изолон 10 мм',
  'Подошва: искусственная кожа',
  'Застёжка: резинка',
  'Производство: Беларусь, Минск',
  'Вес без упаковки: 285 г',
];

export function buildKnowledgeText() {
  const sizes = SIZE_CHART.rows
    .map(
      (r) =>
        `  ${r.size}: стопа ${r.footLength}, стелька ${r.insoleLength}, высота ${r.height}`,
    )
    .join('\n');

  const products = PRODUCTS.map(
    (p) =>
      `  ${p.name}: ${p.price} руб. (было ${p.oldPrice}), ${p.reviews}, WB: ${p.wbUrl}`,
  ).join('\n');

  const delivery = DELIVERY.options.map((o) => `  ${o.label} — ${o.hint}`).join('\n');

  const faq = FAQ.map((f) => `  В: ${f.q}\n  О: ${f.a}`).join('\n\n');

  return `
БРЕНД: ${SITE.brand} — ${SITE.tagline}
Сайт: ${SITE.siteUrl}
Каталог: ${SITE.catalogUrl}
Корзина: ${SITE.cartUrl}
Опт: ${SITE.wholesaleUrl}

КОНТАКТЫ:
  Телефон: ${CONTACTS.phone}
  WhatsApp: +${CONTACTS.whatsapp}
  Email: ${CONTACTS.email}
  Самовывоз: ${CONTACTS.address}, ${CONTACTS.pickupHours}

КАК ЗАКАЗАТЬ:
  1. Выбрать расцветку в каталоге
  2. Добавить в корзину с нужным размером
  3. Оформить заявку (имя, телефон, доставка)
  4. Менеджер свяжется и уточнит оплату и сроки
  Альтернатива: заказ на Wildberries

РАЗМЕРНАЯ СЕТКА:
${sizes}
${SIZE_CHART.fitNote}
${SIZE_CHART.importantNote}

КАТАЛОГ (4 расцветки, размеры 25–42):
${products}

ДОСТАВКА:
  ${DELIVERY.orderHours}
  ${DELIVERY.sameDayNote}
${delivery}

ОПТ: от 10 пар, производство от ${DELIVERY.wholesaleLeadDays} рабочих дней, предоплата 50%.

ХАРАКТЕРИСТИКИ:
${SPECS.map((s) => `  ${s}`).join('\n')}

FAQ:
${faq}
`.trim();
}
