# By Milia — сайт (MVP)

Статический сайт с каталогом (5 расцветок × 6 размеров), корзиной и заявкой в WhatsApp + email.

**Сайт:** https://tolkachev14881488-beep.github.io/bymilia/

## Запуск локально

Нужен локальный сервер (модули ES6 не работают с `file://`):

```bash
npx --yes serve .
```

Откройте адрес из терминала (обычно http://localhost:3000).

## Что настроить в первую очередь

Файл **`js/config.js`**:

- `CONTACTS.phone`, `phoneRaw`, `whatsapp`, `email`
- `CONTACTS.instagram`

Файл **`js/products.js`**:

- цены (`price`)
- названия расцветок, описания, артикулы (`skuPrefix`)

Положите в **`assets/`**:

- `logo.png` — уже есть
- фото товаров (позже можно подключить в карточках)
- `pricelist.pdf` — для страницы «Опт»

## Структура

- `index.html` — главная
- `catalog.html`, `product.html`, `cart.html`
- `pages/` — информационные страницы
- `css/styles.css` — стили (акцент: оранжевый `#ff7f00`, тёплая палитра)

## Заказ

Корзина хранится в `localStorage`. По кнопке «Отправить» открываются WhatsApp и почтовый клиент с текстом заказа.

Для продакшена без `mailto` можно подключить Formspree, Telegram Bot API или простой backend.
