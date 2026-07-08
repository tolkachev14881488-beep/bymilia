import { buildFallbackReply } from '../lib/fallback-reply.js';
import { buildSystemPrompt } from '../lib/prompt.js';

const MAX_MESSAGES = 20;
const MAX_USER_CHARS = 2000;

function json(res, status, body) {
  res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Только POST' });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return json(res, 400, { error: 'Некорректный JSON' });
  }

  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return json(res, 400, { error: 'Нужен массив messages' });
  }

  if (messages.length > MAX_MESSAGES) {
    return json(res, 400, { error: `Не больше ${MAX_MESSAGES} сообщений в истории` });
  }

  const sanitized = [];
  for (const msg of messages) {
    if (!msg || (msg.role !== 'user' && msg.role !== 'assistant')) continue;
    const content = String(msg.content || '').trim().slice(0, MAX_USER_CHARS);
    if (!content) continue;
    sanitized.push({ role: msg.role, content });
  }

  if (!sanitized.length || sanitized[sanitized.length - 1].role !== 'user') {
    return json(res, 400, { error: 'Последнее сообщение должно быть от user' });
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return json(res, 200, {
      reply: buildFallbackReply(sanitized),
      model: 'knowledge-fallback',
      usage: null,
    });
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        max_tokens: 600,
        messages: [{ role: 'system', content: buildSystemPrompt() }, ...sanitized],
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      const detail = data?.error?.message || 'Ошибка OpenAI';
      return json(res, upstream.status >= 500 ? 502 : 400, { error: detail });
    }

    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return json(res, 502, { error: 'Пустой ответ модели' });
    }

    return json(res, 200, {
      reply,
      model,
      usage: data.usage ?? null,
    });
  } catch (err) {
    console.error('chat error:', err);
    return json(res, 500, { error: 'Внутренняя ошибка сервера' });
  }
}
