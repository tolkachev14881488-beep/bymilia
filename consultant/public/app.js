const messagesEl = document.getElementById('messages');
const form = document.getElementById('composer');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send');
const quickPrompts = document.getElementById('quick-prompts');

/** @type {{ role: 'user' | 'assistant', content: string }[]} */
const history = [];

const WELCOME =
  'Здравствуйте! Я консультант By Milia — помогу подобрать сапожки для разогрева стоп: размер, расцветку, доставку и заказ. Чем могу помочь?';

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function linkify(text) {
  const escaped = escapeHtml(text);
  return escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
  );
}

function renderMessage(role, content, { typing = false } = {}) {
  const el = document.createElement('div');
  el.className = `msg msg--${role}${typing ? ' msg--typing' : ''}`;
  el.innerHTML = `
    <div class="msg-avatar" aria-hidden="true">${role === 'assistant' ? 'M' : 'Вы'}</div>
    <div class="msg-bubble">${typing ? '<span class="dots"><span></span><span></span><span></span></span>' : linkify(content)}</div>
  `;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}

function setLoading(loading) {
  sendBtn.disabled = loading;
  input.disabled = loading;
  quickPrompts.querySelectorAll('button').forEach((b) => {
    b.disabled = loading;
  });
}

async function sendMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  input.value = '';
  autoResize();

  history.push({ role: 'user', content: trimmed });
  renderMessage('user', trimmed);

  const typingEl = renderMessage('assistant', '', { typing: true });
  setLoading(true);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    });

    const data = await res.json().catch(() => ({}));

    typingEl.remove();

    if (!res.ok) {
      const errText = data.error || `Ошибка ${res.status}`;
      renderMessage('assistant', `Извините, не получилось ответить: ${errText}. Попробуйте ещё раз.`);
      history.pop();
      return;
    }

    history.push({ role: 'assistant', content: data.reply });
    renderMessage('assistant', data.reply);
  } catch {
    typingEl.remove();
    renderMessage('assistant', 'Нет связи с сервером. Проверьте интернет и попробуйте снова.');
    history.pop();
  } finally {
    setLoading(false);
    input.focus();
  }
}

function autoResize() {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage(input.value);
});

input.addEventListener('input', autoResize);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

quickPrompts.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-prompt]');
  if (!btn || btn.disabled) return;
  sendMessage(btn.dataset.prompt);
});

renderMessage('assistant', WELCOME);
input.focus();
