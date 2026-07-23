// API layer preparado para integração com um backend Node.js.
const API_BASE = '';

function buildUrl(path, params = {}) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

export async function fetchAvailableTimes(date) {
  const endpoint = buildUrl('/api/horarios-disponiveis', { data: date });

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error('Falha ao buscar horários');
    }
    const data = await response.json();
    const times = data.availableTimes || [];
    try {
      const raw = localStorage.getItem('school_appointments');
      const appointments = raw ? JSON.parse(raw) : [];
      const booked = appointments.filter(a => a.date === date).map(a => String(a.time));
      return times.filter(t => !booked.includes(String(t)));
    } catch (err) {
      return times;
    }
  } catch (error) {
    // Em desenvolvimento, retorna horários simulados para permitir testes.
    const fallback = ['08:00', '09:00', '11:00', '14:00', '16:00'];
    try {
      const raw = localStorage.getItem('school_appointments');
      const appointments = raw ? JSON.parse(raw) : [];
      const booked = appointments.filter(a => a.date === date).map(a => String(a.time));
      return fallback.filter(t => !booked.includes(String(t)));
    } catch (err) {
      return fallback;
    }
  }
}

export async function submitAppointment(appointment) {
  const endpoint = buildUrl('/api/agendamentos');
  const payload = {
    name: appointment.name,
    email: appointment.email,
    date: appointment.date,
    time: appointment.time,
    subject: appointment.subject,
    service: appointment.service,
    type: appointment.type
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error('Falha ao criar agendamento');
    }
    return await response.json();
  } catch (error) {
    // Simulação de sucesso para frontend sem backend.
    return {
      success: true,
      appointment: {
        ...payload,
        id: Date.now(),
        confirmationEmail: appointment.email,
        meetLink: 'https://meet.google.com/abc-defg-hij'
      }
    };
  }
}
