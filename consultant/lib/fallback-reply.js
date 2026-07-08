import {
  CONTACTS,
  DELIVERY,
  FAQ,
  PRODUCTS,
  SITE,
  SIZE_CHART,
} from './knowledge.js';

function lastUserMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'user') return messages[i].content.toLowerCase();
  }
  return '';
}

function pickSizeByFootCm(cm) {
  const row = SIZE_CHART.rows.find((r) => {
    const match = r.footLength.match(/(\d+)[–-](\d+)/);
    if (!match) return false;
    return cm >= Number(match[1]) && cm <= Number(match[2]);
  });
  return row?.size ?? null;
}

function formatSizeTable() {
  return SIZE_CHART.rows
    .map((r) => `• ${r.size} — стопа ${r.footLength}, стелька ${r.insoleLength}`)
    .join('\n');
}

function formatProducts() {
  return PRODUCTS.map((p) => `• ${p.name} — ${p.price} руб.`).join('\n');
}

function replySize(text) {
  const cmMatch = text.match(/(\d{2})\s*(?:см|cm)?/);
  const overBallet = /пуант|балетк|поверх/.test(text);
  let size = cmMatch ? pickSizeByFootCm(Number(cmMatch[1])) : null;

  if (size && overBallet) {
    const idx = SIZE_CHART.rows.findIndex((r) => r.size === size);
    if (idx >= 0 && idx < SIZE_CHART.rows.length - 1) {
      size = SIZE_CHART.rows[idx + 1].size;
    }
  }

  if (size) {
    return `По длине стопы рекомендую размер ${size}.

${SIZE_CHART.fitNote}. ${overBallet ? 'С учётом носки поверх балеток/пуантов — взял на размер больше.' : SIZE_CHART.importantNote}

Дальше:
1. Откройте каталог: ${SITE.catalogUrl}
2. Выберите расцветку и добавьте размер ${size} в корзину
3. Оформите заявку — менеджер свяжется в WhatsApp

Если сомневаетесь, напишите возраст ребёнка и длину стопы в см — уточню.`;
  }

  return `Чтобы подобрать размер, напишите длину стопы в см (можно измерить линейкой).

Размерная сетка:
${formatSizeTable()}

${SIZE_CHART.importantNote}

Каталог: ${SITE.catalogUrl}`;
}

function replyColors(text) {
  if (/розов|девоч|принцесс|единорог/.test(text)) {
    return `Для любителей розового чаще берут Единорог или Цветы — яркие и «девичьи» принты.

Расцветки и цены:
${formatProducts()}

Посмотреть все модели: ${SITE.catalogUrl}
На Wildberries тоже можно заказать с быстрой доставкой по РБ.`;
  }

  if (/чёрн|черн|строг|универс/.test(text)) {
    return `Универсальный вариант — Чёрные сапожки (${PRODUCTS[0].price} руб., ${PRODUCTS[0].reviews}).

Все расцветки:
${formatProducts()}

Каталог: ${SITE.catalogUrl}`;
  }

  return `В коллекции By Milia 4 расцветки:
${formatProducts()}

Для девочки 4–8 лет часто выбирают Единорог или Цветы, для старших — Чёрные или Упс.

Откройте каталог и сравните фото: ${SITE.catalogUrl}`;
}

function replyDelivery(text) {
  const options = DELIVERY.options.map((o) => `• ${o.label} — ${o.hint}`).join('\n');
  const cityNote = /гомел|брест|витебск|гродно|могил/.test(text)
    ? '\n\nПо Беларуси удобна Белпочта/Европочта: обычно 2–5 дней после отправки.'
    : '';

  return `${DELIVERY.orderHours}
${DELIVERY.sameDayNote}

Способы доставки:
${options}${cityNote}

Оформить заказ: ${SITE.cartUrl} или WhatsApp +${CONTACTS.whatsapp}.`;
}

function replyWholesale() {
  return `Опт By Milia — от 10 пар для студий и коллективов.

• Индивидуальный расчёт стоимости
• Бесплатная доставка по Беларуси
• Производство от ${DELIVERY.wholesaleLeadDays} рабочих дней
• Предоплата 50% на расчётный счёт

Оставьте заявку на странице опта: ${SITE.wholesaleUrl}
Или напишите менеджеру: +${CONTACTS.whatsapp} (WhatsApp).`;
}

function replyOrder() {
  return `Заказ на сайте — без регистрации:

1. Каталог → выберите расцветку: ${SITE.catalogUrl}
2. Укажите размер и добавьте в корзину
3. Корзина → имя, телефон, способ доставки: ${SITE.cartUrl}
4. Отправьте заявку — менеджер подтвердит оплату и сроки

Также можно заказать на Wildberries или написать в WhatsApp: +${CONTACTS.whatsapp}.`;
}

function replyPrice() {
  return `Актуальные цены:
${formatProducts()}

Заказ на сайте или Wildberries. Каталог: ${SITE.catalogUrl}`;
}

function replyWash() {
  return FAQ.find((f) => f.q.includes('стирать'))?.a ?? 'Деликатная стирка при низкой температуре.';
}

function replyGreeting() {
  return `Здравствуйте! Я консультант ${SITE.brand} — помогу с размером, расцветкой, доставкой и заказом.

Что подсказать?
• Подбор размера (напишите длину стопы в см)
• Выбор расцветки
• Доставка по Беларуси
• Опт от 10 пар

Каталог: ${SITE.catalogUrl}`;
}

/** Ответ без OpenAI — на основе базы знаний By Milia */
export function buildFallbackReply(messages) {
  const text = lastUserMessage(messages);

  if (!text || /^(привет|здравств|добрый|hi|hello)\b/.test(text)) {
    return replyGreeting();
  }
  if (/размер|стоп|см|подойд|подбер/.test(text)) {
    return replySize(text);
  }
  if (/расцвет|цвет|принт|единорог|чёрн|черн|розов|девоч/.test(text)) {
    return replyColors(text);
  }
  if (/доставк|почт|курьер|европочт|самовывоз|гомел|минск|беларус/.test(text)) {
    return replyDelivery(text);
  }
  if (/опт|коллектив|студи|10 пар|школ/.test(text)) {
    return replyWholesale();
  }
  if (/заказ|оформ|корзин|купить|как заказ/.test(text)) {
    return replyOrder();
  }
  if (/цен|стоим|сколько стоит|руб/.test(text)) {
    return replyPrice();
  }
  if (/стир|уход|мыть/.test(text)) {
    return replyWash();
  }

  return `Я могу помочь с сапожками ${SITE.brand}: размер (25–42), расцветка, доставка, заказ и опт.

Напишите, например: «стопа 19 см» или «доставка в Гомель».

Каталог: ${SITE.catalogUrl}
Менеджер: +${CONTACTS.whatsapp} (WhatsApp).`;
}
