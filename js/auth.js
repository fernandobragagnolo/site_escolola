const API_BASE = window.location.origin;
const FALLBACK_API_BASE = 'http://localhost:4000';

function buildUrl(path, params = {}, base = API_BASE) {
  const url = new URL(path, base);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

async function fetchWithFallback(path, options = {}, params = {}) {
  const primaryUrl = buildUrl(path, params, API_BASE);
  const fallbackUrl = buildUrl(path, params, FALLBACK_API_BASE);

  try {
    const response = await fetch(primaryUrl, options);
    if (response.ok) return response.json();
    if (response.status === 404 || response.status >= 500) {
      const fallbackResponse = await fetch(fallbackUrl, options);
      return fallbackResponse.ok ? fallbackResponse.json() : { success: false, message: 'Falha ao acessar a API de autenticação.' };
    }
    return response.json();
  } catch (primaryError) {
    try {
      const fallbackResponse = await fetch(fallbackUrl, options);
      return fallbackResponse.ok ? fallbackResponse.json() : { success: false, message: 'Falha ao acessar a API de autenticação.' };
    } catch (fallbackError) {
      return { success: false, message: 'Não foi possível conectar ao servidor de autenticação.' };
    }
  }
}

export async function registerUser({ name, email, password }) {
  const result = await fetchWithFallback('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });

  if (result && result.success) return result;

  // Fallback caso a API offline
  try {
    const rawUsers = localStorage.getItem('school_users_db') || '[]';
    const users = JSON.parse(rawUsers);
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { success: false, message: 'Este e-mail já está cadastrado.' };
    }
    const newUser = { id: 'usr_' + Date.now(), name, email, createdAt: Date.now() };
    users.push({ ...newUser, password });
    localStorage.setItem('school_users_db', JSON.stringify(users));
    return { success: true, user: newUser, message: 'Conta criada com sucesso!' };
  } catch (e) {
    return result;
  }
}

export async function loginUser({ email, password }) {
  const result = await fetchWithFallback('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (result && result.success) return result;

  // Fallback se API offline ou 404
  try {
    const rawUsers = localStorage.getItem('school_users_db') || '[]';
    const users = JSON.parse(rawUsers);
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, message: 'Usuário não encontrado. Cadastre-se primeiro.' };
    }
    if (user.password && user.password !== password) {
      return { success: false, message: 'Senha incorreta.' };
    }
    const { password: _, ...cleanUser } = user;
    return { success: true, user: cleanUser, message: 'Login realizado com sucesso!' };
  } catch (e) {
    return result;
  }
}

export async function sendLoginCode(email) {
  return fetchWithFallback('/api/auth/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
}

export async function verifyAuthToken(token) {
  // kept for backward compatibility but prefer verifyWithCode
  return fetchWithFallback('/api/auth/verify-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(token)
  });
}

export async function verifyWithCode(email, code) {
  return fetchWithFallback('/api/auth/verify-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });
}

export async function fetchUserAppointments(userId) {
  const response = await fetchWithFallback('/api/appointments', {}, { userId });
  if (!response.success) {
    throw new Error(response.message || 'Falha ao buscar agendamentos');
  }
  return response;
}

export async function submitAppointment(appointment) {
  const response = await fetchWithFallback('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointment)
  });
  if (!response.success) {
    throw new Error(response.message || 'Falha ao criar agendamento');
  }
  return response;
}
