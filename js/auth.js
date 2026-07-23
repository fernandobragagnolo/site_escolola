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
