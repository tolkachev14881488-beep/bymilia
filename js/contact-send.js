import { CONTACTS } from './config.js';

/** Открыть WhatsApp с текстом; не перезагружает страницу */
export function sendToManager({ message }) {
  const waUrl = `https://wa.me/${CONTACTS.whatsapp}?text=${encodeURIComponent(message)}`;
  const opened = window.open(waUrl, '_blank', 'noopener,noreferrer');
  if (!opened) {
    window.location.assign(waUrl);
  }
  return true;
}
