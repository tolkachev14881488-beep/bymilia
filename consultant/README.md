# ИИ-консультант By Milia (Vercel)

Отдельный тестовый стенд консультанта для повышения конверсии. **Не встроен** в основной сайт by-milia.by.

## Что внутри

- `public/` — чат-интерфейс для ручного теста
- `api/chat.js` — serverless-прокси к OpenAI (ключ только на сервере)
- `lib/knowledge.js` — база знаний By Milia (каталог, размеры, доставка, FAQ)

## Деплой на Vercel

1. Зайдите на [vercel.com](https://vercel.com) → **Add New Project**
2. Импортируйте репозиторий (или загрузите папку `consultant`)
3. **Root Directory:** `consultant`
4. **Environment Variables:**
   - `OPENAI_API_KEY` — ваш ключ OpenAI
   - `OPENAI_MODEL` — опционально, по умолчанию `gpt-4o-mini`
5. Deploy

После деплоя откройте URL проекта — увидите чат со быстрыми кнопками.

## Локальный тест

Нужен [Vercel CLI](https://vercel.com/docs/cli):

```bash
cd consultant
cp .env.example .env.local
# впишите OPENAI_API_KEY в .env.local
npx vercel dev
```

Откройте адрес из терминала (обычно http://localhost:3000).

## API

### `POST /api/chat`

```json
{
  "messages": [
    { "role": "user", "content": "Стопа 19 см, какой размер?" }
  ]
}
```

Ответ:

```json
{
  "reply": "...",
  "model": "gpt-4o-mini",
  "usage": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 }
}
```

### `GET /api/health`

Проверка, что сервис жив.

## Следующие шаги (когда будете готовы)

- Виджет для встраивания на сайт (отдельная задача)
- Аналитика: открыл чат → рекомендация → клик в каталог
- Обновление базы знаний из `data/site.json` скриптом
