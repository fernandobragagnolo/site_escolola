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

export function validateRegisterData({ name, email, password, confirmPassword }) {
  const errors = {};
  if (!isNotEmpty(name)) {
    errors.name = 'Informe seu nome completo.';
  } else if (name.trim().length < 3) {
    errors.name = 'O nome deve ter pelo menos 3 caracteres.';
  }

  if (!isNotEmpty(email) || !isValidEmail(email)) {
    errors.email = 'Informe um e-mail válido.';
  }

  if (!isNotEmpty(password)) {
    errors.password = 'Crie uma senha para sua conta.';
  } else if (password.length < 6) {
    errors.password = 'A senha deve conter no mínimo 6 caracteres.';
  }

  if (confirmPassword !== undefined && confirmPassword !== password) {
    errors.confirmPassword = 'As senhas não coincidem.';
  }

  return errors;
}

export function validateLoginData({ email, password }) {
  const errors = {};
  if (!isNotEmpty(email) || !isValidEmail(email)) {
    errors.email = 'Informe um e-mail válido.';
  }
  if (!isNotEmpty(password)) {
    errors.password = 'Informe sua senha.';
  }
  return errors;
}

