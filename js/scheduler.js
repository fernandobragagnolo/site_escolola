export function buildAppointmentState(subject) {
  return {
    name: '',
    email: '',
    date: '',
    time: '',
    subject: subject || '',
    service: 'Aula personalizada',
    type: 'Regular'
  };
}

export function buildConfirmationData(appointment, response) {
  return {
    ...appointment,
    confirmationEmail: response.confirmationEmail || appointment.email,
    meetLink: response.meetLink || null
  };
}

export function resetAppointment(state) {
  state.appointment = buildAppointmentState(state.selectedSubject?.name);
  state.availableTimes = [];
  state.timeError = '';
  state.loadingTimes = false;
  state.isScheduling = false;
}
