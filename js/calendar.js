export function formatDateForApi(dateString) {
  return dateString;
}

export function parseDateStringAsLocal(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateLabel(dateString) {
  if (!dateString) return '';
  const date = parseDateStringAsLocal(dateString);
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

export function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}
