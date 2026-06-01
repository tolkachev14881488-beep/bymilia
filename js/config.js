/** Настройки сайта — меняйте контакты и пороги доставки здесь */
export const SITE = {
  brand: 'By Milia',
  tagline: 'Сапожки для разогрева стоп для танцев',
  currency: 'BYN',
  currencyLabel: 'руб.',
};

export const CONTACTS = {
  phone: '+375 29 000-00-00',
  phoneRaw: '375290000000',
  email: 'orders@bymilia.by',
  whatsapp: '375290000000',
  instagram: 'https://instagram.com/',
  address: 'г. Минск, ул. Панченко, 8',
  pickupHours: '9:00–18:00, по предварительной договорённости',
};

export const DELIVERY = {
  freePostFrom: 50,
  freeCourierMinskFrom: 150,
  sameDayBeforeHour: 13,
  wholesaleLeadDays: 14,
};

export const SIZES = [
  { id: '25-27', label: '25–27' },
  { id: '28-30', label: '28–30' },
  { id: '31-33', label: '31–33' },
  { id: '34-36', label: '34–36' },
  { id: '37-39', label: '37–39' },
  { id: '40-42', label: '40–42' },
];

export const DELIVERY_OPTIONS = [
  { id: 'pickup', label: 'Самовывоз (Минск, ул. Панченко, 8)', hint: 'Бесплатно' },
  { id: 'courier_minsk', label: 'Курьер по Минску', hint: 'Бесплатно от 150 руб.' },
  { id: 'europost', label: 'Почта / Европочта (Беларусь)', hint: 'Бесплатно от 50 руб.' },
  { id: 'cdek_rf', label: 'СДЭК (Россия)', hint: 'Стоимость по региону, уточнит менеджер' },
];
