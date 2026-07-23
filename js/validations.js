export function isValidEmail(value) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(value);
}

export function isNotEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateAppointmentData({ name, email }) {
  const errors = {};
  if (!isNotEmpty(name)) {
    errors.name = 'Informe o nome completo.';
  }
  if (!isNotEmpty(email) || !isValidEmail(email)) {
    errors.email = 'Informe um e-mail válido.';
  }
  return errors;
}
