import { APP_DATA } from './data.js';

// Funções reutilizáveis para abrir o WhatsApp com mensagens personalizadas.
function buildWhatsAppUrl(number, message) {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encodedMessage}`;
}

export function openWhatsApp(message, number = APP_DATA.whatsappNumber) {
  const url = buildWhatsAppUrl(number, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}
