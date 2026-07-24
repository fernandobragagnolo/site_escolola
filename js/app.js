import { APP_DATA } from './data.js?v=20260718-4';
import { ROUTE_CONFIG } from './routes.js?v=20260718-4';
import { fetchAvailableTimes } from './api.js?v=20260718-4';
import { sendLoginCode, verifyWithCode, fetchUserAppointments, submitAppointment } from './auth.js';
import { validateAppointmentData, isNotEmpty, isValidEmail } from './validations.js?v=20260718-4';
import { renderStepper, renderLoading, renderAlert } from './ui.js?v=20260718-4';
import { formatDateLabel, getTodayDate, parseDateStringAsLocal } from './calendar.js?v=20260718-4';
import { buildAppointmentState, buildConfirmationData, resetAppointment } from './scheduler.js';
import { openWhatsApp } from './whatsapp.js';

const state = {
  currentRoute: 'home',
  history: [],
  selectedSubject: null,
  selectedMaterial: null,
  selectedMiniProvaType: null,
  subjectText: '',
  appointment: buildAppointmentState(null),
  availableTimes: [],
  selectedTime: '',
  showAvailableTimes: false,
  formErrors: {},
  loadingTimes: false,
  scheduling: false,
  confirmation: null,
  appointments: [],
  user: null,
  authMessage: '',
  loginLink: '',
  loginToken: ''
};

const appContainer = document.getElementById('app');
const loadingScreen = document.getElementById('loadingScreen');

function showLoading() {
  loadingScreen.classList.add('is-visible');
  setTimeout(() => {
    loadingScreen.classList.remove('is-visible');
  }, 450);
}

function loadStoredAppointments() {
  try {
    const raw = localStorage.getItem('school_appointments');
    state.appointments = raw ? JSON.parse(raw) : [];
  } catch (error) {
    state.appointments = [];
  }
}

function saveStoredAppointments() {
  localStorage.setItem('school_appointments', JSON.stringify(state.appointments));
}

function loadStoredUser() {
  try {
    const raw = localStorage.getItem('school_user');
    state.user = raw ? JSON.parse(raw) : null;
  } catch (error) {
    state.user = null;
  }
}

function saveStoredUser() {
  if (state.user) {
    localStorage.setItem('school_user', JSON.stringify(state.user));
  }
}

function clearStoredUser() {
  state.user = null;
  state.appointments = [];
  localStorage.removeItem('school_user');
}

function setAuthMessage(message, route = state.currentRoute) {
  state.authMessage = message;
  render(route);
}

async function loadUserAppointments() {
  if (!state.user) return;
  try {
    const response = await fetchUserAppointments(state.user.id);
    if (response.success) {
      state.appointments = Array.isArray(response.appointments) ? response.appointments : [];
    }
  } catch (error) {
    console.warn('Não foi possível carregar agendamentos do usuário', error);
  }
}

async function verifyTokenFromUrl() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('token');
  if (!token) return;
  // Auto-login via link is disabled to require explicit code entry for security.
  setAuthMessage('Login por link está desabilitado. Abra seu email e cole o código aqui.', 'login');
  // remove token from URL to avoid confusion
  url.searchParams.delete('token');
  window.history.replaceState({}, document.title, url.toString());
}

function removeAppointment(id) {
  const targetId = String(id);
  state.appointments = state.appointments.filter((item) => String(item.id) !== targetId);
  saveStoredAppointments();
}

function renderLogin() {
  return `
    <section class="section-card login-card" data-animate>
      <h2 class="section-title">Entre com seu email</h2>
      <p class="section-copy">Digite seu email para ver seus agendamentos e acessar as reuniões.</p>
      ${state.authMessage ? `<p class="alert-message">${state.authMessage}</p>` : ''}
      <div class="field-group">
        <label for="loginEmail">Email</label>
        <input id="loginEmail" type="email" placeholder="seu@email.com" />
      </div>
      <button class="btn btn-primary btn-block" data-action="login">Entrar</button>
      
    </section>
  `;
}

function renderHome() {
  return `
    <section class="hero-card" data-animate>
      <span class="hero-badge">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.2l7.5 4.2v8.2L12 20.8 4.5 16.6V8.4L12 4.2z" />
        </svg>
        Jornada de estudos guiada
      </span>
      <h1 class="hero-title">Conquiste seu próximo desafio com apoio inteligente.</h1>
      <p class="hero-text">Agende suas aulas em poucos passos e receba confirmações automáticas.</p>
    </section>

    ${state.user ? `
      <section class="section-card" data-animate>
        <div class="section-header">
          <div>
            <p class="section-copy">Logado como <strong>${state.user.email}</strong></p>
          </div>
          <button class="btn btn-secondary btn-small" data-action="logout">Sair</button>
        </div>
      </section>
    ` : ''}

    <section class="grid-home" data-animate>
      <article class="choice-card">
        <div class="choice-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zm0 2v16h10V4H7zm2 3h6v2H9V7zm0 4h6v2H9v-2zm0 4h4v2H9v-2z" />
          </svg>
        </div>
        <h2 class="choice-title">Agendamento de Aulas</h2>
        <p class="choice-text">Selecione a matéria e siga o fluxo para agendar sua aula online de forma profissional.</p>
        <button class="btn btn-primary" data-route="agendamento">AGENDAR AULA</button>
      </article>

      <article class="choice-card">
        <div class="choice-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm2 4v10h10V7H7zm2 2h6v2H9V9zm0 4h4v2H9v-2z" />
          </svg>
        </div>
        <h2 class="choice-title">Materiais de Preparação</h2>
        <p class="choice-text">Escolha materiais para reforçar seus estudos antes da aula.</p>
        <button class="btn btn-secondary" data-route="materiais">VER MATERIAIS</button>
      </article>
    </section>
  `;
}

function renderSubjectSelection() {
  const items = APP_DATA.subjects.map((subject) => `
    <button class="subject-card" data-action="select-subject" data-subject-id="${subject.id}" data-subject-name="${subject.name}">
      <div>
        <strong>${subject.name}</strong>
        <span>${subject.description}</span>
      </div>
      <span class="arrow">→</span>
    </button>
  `).join('');

  return `
    <section class="section-card" data-animate>
      <button class="back-button" data-action="go-back">
        <svg viewBox="0 0 24 24"><path d="M15.5 5.5L10 12l5.5 6.5L14 20l-8-8 8-8z" /></svg>
        Voltar
      </button>
      <div class="progress-bar"><div class="progress-fill" style="width: 20%"></div></div>
      <div class="progress-label">
        <span>Passo 1 de 5</span>
        <strong>Escolha a matéria</strong>
      </div>
      <h2 class="section-title">Escolha a matéria</h2>
      <p class="section-copy">Selecione a matéria que você quer estudar para iniciar o seu agendamento.</p>
      <div class="subject-grid">${items}</div>
    </section>
  `;
}

function renderMaterials() {
  const items = APP_DATA.materials
    .map((material) => `
      <button class="subject-card" data-action="open-material" data-material-id="${material.id}">
        <div>
          <strong>${material.title}</strong>
          <span>${material.description}</span>
        </div>
        <span class="arrow">→</span>
      </button>
    `)
    .join('');

  return `
    <section class="section-card" data-animate>
      <button class="back-button" data-action="go-back">
        <svg viewBox="0 0 24 24"><path d="M15.5 5.5L10 12l5.5 6.5L14 20l-8-8 8-8z" /></svg>
        Voltar
      </button>
      <div class="progress-bar"><div class="progress-fill" style="width: 20%"></div></div>
      <div class="progress-label">
        <span>Passo 1 de 2</span>
        <strong>Materiais de preparação</strong>
      </div>
      <h2 class="section-title">Selecione o material</h2>
      <p class="section-copy">Escolha o tipo de material que você deseja receber.</p>
      <div class="subject-grid">${items}</div>
    </section>
  `;
}

function renderMiniProvas() {
  const items = APP_DATA.miniProvaTypes
    .map((type) => `
      <button class="subject-card" data-action="select-mini-prova" data-prova-type="${type}">
        <div>
          <strong>${type}</strong>
          <span>Receba uma mini prova personalizada para revisão.</span>
        </div>
        <span class="arrow">→</span>
      </button>
    `)
    .join('');

  return `
    <section class="section-card" data-animate>
      <button class="back-button" data-action="go-back">
        <svg viewBox="0 0 24 24"><path d="M15.5 5.5L10 12l5.5 6.5L14 20l-8-8 8-8z" /></svg>
        Voltar
      </button>
      <div class="progress-bar"><div class="progress-fill" style="width: 40%"></div></div>
      <div class="progress-label">
        <span>Passo 2 de 3</span>
        <strong>Escolha o tipo de prova</strong>
      </div>
      <h2 class="section-title">Tipo de mini prova</h2>
      <p class="section-copy">Selecione o formato ideal para seu treino.</p>
      <div class="subject-grid">${items}</div>
    </section>
  `;
}

function renderSubjectSelectionForMaterials() {
  const titleMap = {
    'mini-provas': 'Mini Provas',
    exercicios: 'Exercícios',
    assuntos: 'Assuntos Recomendados'
  };

  const copyMap = {
    'mini-provas': 'Escolha a matéria para receber uma mini prova personalizada.',
    exercicios: 'Selecione a matéria para receber exercícios práticos.',
    assuntos: 'Escolha a matéria para receber os assuntos recomendados.'
  };

  const title = titleMap[state.selectedMaterial] || 'Materiais';
  const copy = copyMap[state.selectedMaterial] || 'Selecione a matéria desejada.';
  const extra = state.selectedMaterial === 'mini-provas' && state.selectedMiniProvaType
    ? `<p class="section-copy">Tipo selecionado: <strong>${state.selectedMiniProvaType}</strong></p>`
    : '';

  const items = APP_DATA.subjects
    .map((subject) => `
      <button class="subject-card" data-action="select-material-subject" data-subject-name="${subject.name}">
        <div>
          <strong>${subject.name}</strong>
          <span>${subject.description}</span>
        </div>
        <span class="arrow">→</span>
      </button>
    `)
    .join('');

  return `
    <section class="section-card" data-animate>
      <button class="back-button" data-action="go-back">
        <svg viewBox="0 0 24 24"><path d="M15.5 5.5L10 12l5.5 6.5L14 20l-8-8 8-8z" /></svg>
        Voltar
      </button>
      <div class="progress-bar"><div class="progress-fill" style="width: 80%"></div></div>
      <div class="progress-label">
        <span>Passo 3 de 3</span>
        <strong>${title}</strong>
      </div>
      <h2 class="section-title">${title}</h2>
      <p class="section-copy">${copy}</p>
      ${extra}
      <div class="subject-grid">${items}</div>
    </section>
  `;
}

function renderDadosAgendamento() {
  const appointment = state.appointment;
  const errors = state.formErrors;

  return `
    <section class="input-card" data-animate>
      ${renderStepper(['Dados', 'Data', 'Horário', 'Confirmação'], 0)}
      <button class="back-button" data-action="go-back">
        <svg viewBox="0 0 24 24"><path d="M15.5 5.5L10 12l5.5 6.5L14 20l-8-8 8-8z" /></svg>
        Voltar
      </button>
      <h2 class="section-title">Seus dados</h2>
      <p class="section-copy">Preencha seu nome e e-mail para continuarmos com o agendamento.</p>
      ${errors.general ? renderAlert(errors.general) : ''}
      <div class="field-group">
        <label for="appointmentName">Nome completo</label>
        <input id="appointmentName" type="text" value="${appointment.name}" placeholder="João Silva" />
        ${errors.name ? `<p class="validation-text">${errors.name}</p>` : ''}
      </div>
      <div class="field-group">
        <label for="appointmentEmail">E-mail</label>
        <input id="appointmentEmail" type="email" value="${appointment.email}" placeholder="joao@email.com" />
        ${errors.email ? `<p class="validation-text">${errors.email}</p>` : ''}
      </div>
      <button class="btn btn-primary btn-block" data-action="continue-dados">CONTINUAR</button>
    </section>
  `;
}

function renderDataAgendamento() {
  const appointment = state.appointment;
  const minDate = getTodayDate();

  return `
    <section class="input-card" data-animate>
      ${renderStepper(['Dados', 'Data', 'Horário', 'Confirmação'], 1)}
      <button class="back-button" data-action="go-back">
        <svg viewBox="0 0 24 24"><path d="M15.5 5.5L10 12l5.5 6.5L14 20l-8-8 8-8z" /></svg>
        Voltar
      </button>
      <h2 class="section-title">Escolha a data</h2>
      <p class="section-copy">Selecione a data desejada para a sua aula.</p>
      ${state.formErrors.date ? renderAlert(state.formErrors.date) : ''}
      <div class="field-group">
        <label for="appointmentDate">Data da aula</label>
        <input id="appointmentDate" type="date" value="${appointment.date}" min="${minDate}" />
      </div>
      <button class="btn btn-primary btn-block" data-action="continue-data">CONTINUAR</button>
    </section>
  `;
}

function renderHorarioAgendamento() {
  const appointment = state.appointment;

  return `
    <section class="input-card" data-animate>
      ${renderStepper(['Dados', 'Data', 'Horário', 'Confirmação'], 2)}
      <button class="back-button" data-action="go-back">
        <svg viewBox="0 0 24 24"><path d="M15.5 5.5L10 12l5.5 6.5L14 20l-8-8 8-8z" /></svg>
        Voltar
      </button>
      <h2 class="section-title">Horários disponíveis</h2>
      <p class="section-copy">Confira os horários livres e escolha o melhor momento para sua aula.</p>
      ${state.loadingTimes ? renderLoading('Buscando horários disponíveis...') : ''}
      ${state.availableTimes.length === 0 && !state.loadingTimes ? renderAlert('Nenhum horário disponível para esta data. Escolha outra data.') : ''}
      <div class="field-group">
        <button class="btn btn-primary btn-block" data-action="toggle-times" ${state.availableTimes.length === 0 ? 'disabled' : ''}>
          Horários disponíveis
        </button>
      </div>
      ${state.showAvailableTimes ? `
        <div class="time-grid">
          ${state.availableTimes
            .map((time) => `
              <button class="time-button ${appointment.time === time ? 'active' : ''}" data-action="select-time" data-time="${time}">${time}</button>
            `)
            .join('')}
        </div>
      ` : ''}
      <button class="btn btn-primary btn-block" data-action="schedule-appointment" ${!appointment.time ? 'disabled' : ''}>AGENDAR</button>
    </section>
  `;
}

function renderConfirmacao() {
  const appointment = state.appointment;
  const confirmation = state.confirmation;

  return `
    <section class="confirmation-card" data-animate>
      <div class="confirmation-badge">✅ Agendamento realizado com sucesso!</div>
      <h2 class="section-title">Tudo certo, ${appointment.name.split(' ')[0] || ''}.</h2>
      <p class="section-copy">Seu agendamento foi confirmado. Confira os detalhes abaixo.</p>
      <div class="confirmation-grid">
        <div><strong>Nome</strong><span>${appointment.name}</span></div>
        <div><strong>Serviço</strong><span>${appointment.service}</span></div>
        <div><strong>Tipo</strong><span>${appointment.type}</span></div>
        <div><strong>Matéria</strong><span>${appointment.subject}</span></div>
        <div><strong>Data</strong><span>${formatDateLabel(appointment.date)}</span></div>
        <div><strong>Horário</strong><span>${appointment.time}</span></div>
        <div><strong>E-mail</strong><span>${confirmation?.confirmationEmail || appointment.email}</span></div>
      </div>
      <div class="confirmation-actions">
        <button class="btn btn-secondary" data-action="back-home">Voltar para Home</button>
        <button class="btn btn-primary" data-action="new-appointment">Novo Agendamento</button>
      </div>
    </section>
  `;
}

function renderWhatsApp() {
  const subjectLabel = state.selectedSubject?.name || state.selectedMaterial || '';

  return `
    <section class="confirmation-card" data-animate>
      <div class="confirmation-badge">📱 Entre no grupo do WhatsApp</div>
      <h2 class="section-title">Fale conosco pelo WhatsApp</h2>
      <p class="section-copy">Para ${subjectLabel ? `<strong>${subjectLabel}</strong> — ` : ''}clique no botão abaixo para entrar no nosso grupo exclusivo.</p>
      <div class="confirmation-actions">
        <a class="btn btn-whatsapp btn-block" href="https://chat.whatsapp.com/F7vWJVLjuDS0wT4mQiWcGz" target="_blank" rel="noopener noreferrer" style="text-align:center;display:block;">
          Entrar no grupo WhatsApp
        </a>
        <button class="btn btn-secondary" data-action="back-home" style="margin-top:12px;">Voltar para Home</button>
      </div>
    </section>
  `;
}

function render(route) {
  const config = ROUTE_CONFIG[route] || ROUTE_CONFIG.home;
  let html = '';

  switch (route) {
    case 'home':
      html = renderHome();
      break;
    case 'login':
      html = renderLogin();
      break;
    case 'agendamento':
      html = renderSubjectSelection();
      break;
    case 'agendamentoDados':
      html = renderDadosAgendamento();
      break;
    case 'agendamentoData':
      html = renderDataAgendamento();
      break;
    case 'agendamentoHorario':
      html = renderHorarioAgendamento();
      break;
    case 'agendamentoConfirmacao':
      html = renderConfirmacao();
      break;
    case 'materiais':
      html = renderMaterials();
      break;
    case 'miniProvas':
      html = renderMiniProvas();
      break;
    case 'miniProvasMateria':
      html = renderSubjectSelectionForMaterials();
      break;
    case 'exerciciosMateria':
      html = renderSubjectSelectionForMaterials();
      break;
    case 'assuntosMateria':
      html = renderSubjectSelectionForMaterials();
      break;
    case 'whatsapp':
      html = renderWhatsApp();
      break;
    default:
      html = renderHome();
  }

  appContainer.innerHTML = html;
  document.title = `${config.title} · ${APP_DATA.brandName}`;

  if (route === 'agendamentoDados') {
    requestAnimationFrame(() => {
      const input = document.getElementById('appointmentName');
      if (input) {
        input.focus();
      }
    });
  }

  if (route === 'agendamentoHorario' && !state.loadingTimes && state.availableTimes.length === 0 && isNotEmpty(state.appointment.date)) {
    loadAvailableTimes();
  }
}

function goTo(route, options = {}) {
  if (state.currentRoute && route !== state.currentRoute && !options.replace) {
    state.history.push(state.currentRoute);
  }

  if (route === 'agendamentoHorario') {
    state.showAvailableTimes = false;
  }

  state.currentRoute = route;
  showLoading();
  setTimeout(() => render(route), 350);
}

function goBack() {
  const previousRoute = state.history.pop() || 'home';
  goTo(previousRoute, { replace: true });
}

async function loadAvailableTimes() {
  state.loadingTimes = true;
  render('agendamentoHorario');
  const date = state.appointment.date;
  const times = await fetchAvailableTimes(date);
  state.availableTimes = Array.isArray(times) ? times : [];
  state.loadingTimes = false;
  render('agendamentoHorario');
}

async function scheduleAppointment() {
  if (!state.user) {
    setAuthMessage('Faça login antes de agendar.');
    goTo('home');
    return;
  }

  state.scheduling = true;
  render('agendamentoHorario');

  const payload = {
    userId: state.user.id,
    studentEmail: state.appointment.email,
    date: state.appointment.date,
    time: state.appointment.time,
    subject: state.appointment.subject,
    professorEmail: null
  };

  const response = await submitAppointment(payload);
  state.scheduling = false;

  if (response.success) {
    const savedAppointment = response.appointment;
    state.appointments.unshift(savedAppointment);
    saveStoredAppointments();
    state.confirmation = buildConfirmationData(state.appointment, response);
    goTo('agendamentoConfirmacao');
  } else {
    state.formErrors.general = 'Não foi possível finalizar o agendamento. Tente novamente mais tarde.';
    render('agendamentoHorario');
  }
}

function handleRouteClick(event) {
  const target = event.target;
  if (target.closest('textarea, input, select')) {
    return;
  }

  const element = target.closest('a[data-route], button[data-route]');
  if (!element) return;

  event.preventDefault();
  const route = element.dataset.route;
  if (route) {
    if (route === 'agendamento' && !state.user) {
      setAuthMessage('Faça login com seu email antes de agendar uma aula.');
      return;
    }
    goTo(route);
  }
}

function handleSubjectInput(event) {
  if (event.target.id === 'subjectText') {
    state.subjectText = event.target.value;
  }
}

function handleActionClick(event) {
  const element = event.target.closest('[data-action]');
  if (!element) return;

  const action = element.dataset.action;

  if (action === 'go-back') {
    goBack();
    return;
  }

  if (action === 'select-subject') {
    state.selectedSubject = {
      id: element.dataset.subjectId,
      name: element.dataset.subjectName
    };
    goTo('whatsapp');
    return;
  }

  if (action === 'continue-dados') {
    const nameInput = document.getElementById('appointmentName');
    const emailInput = document.getElementById('appointmentEmail');

    state.appointment.name = nameInput?.value.trim() || '';
    state.appointment.email = emailInput?.value.trim() || '';
    state.formErrors = validateAppointmentData(state.appointment);

    if (Object.keys(state.formErrors).length > 0) {
      render('agendamentoDados');
      return;
    }

    goTo('agendamentoData');
    return;
  }

  if (action === 'continue-data') {
    const dateInput = document.getElementById('appointmentDate');
    const dateValue = dateInput?.value;

    if (!isNotEmpty(dateValue)) {
      state.formErrors = { date: 'Escolha uma data antes de continuar.' };
      render('agendamentoData');
      return;
    }

    state.appointment.date = dateValue;
    state.availableTimes = [];
    state.appointment.time = '';
    state.showAvailableTimes = false;
    state.formErrors = {};
    goTo('agendamentoHorario');
    return;
  }

 if (action === 'login') {
  const emailInput = document.getElementById('loginEmail');
  const email = emailInput?.value.trim() || '';

  if (!isValidEmail(email)) {
    setAuthMessage('Informe um e-mail válido.');
    return;
  }

  state.user = {
    id: Date.now().toString(),
    email: email
  };

  saveStoredUser();
  state.authMessage = '';

  goTo('materiais');
  return;
}
  if (action === 'logout') {
    clearStoredUser();
    state.authMessage = 'Você saiu da conta.';
    render('home');
    return;
  }

  if (action === 'toggle-times') {
    state.showAvailableTimes = !state.showAvailableTimes;
    render('agendamentoHorario');
    return;
  }

  if (action === 'select-time') {
    const selectedTime = element.dataset.time;
    state.appointment.time = selectedTime;
    render('agendamentoHorario');
    return;
  }

  if (action === 'schedule-appointment') {
    if (!isNotEmpty(state.appointment.time)) {
      state.formErrors = { time: 'Selecione um horário antes de agendar.' };
      render('agendamentoHorario');
      return;
    }
    scheduleAppointment();
    return;
  }

  if (action === 'back-home') {
    resetAppointment(state);
    state.selectedSubject = null;
    state.history = [];
    goTo('home');
    return;
  }

  if (action === 'new-appointment') {
    resetAppointment(state);
    state.selectedSubject = null;
    state.history = [];
    goTo('home');
    return;
  }

  if (action === 'cancel-appointment') {
    const appointmentId = element.dataset.appointmentId;
    removeAppointment(appointmentId);
    if (state.currentRoute === 'home') {
      render('home');
    } else {
      goTo('home');
    }
    return;
  }

  if (action === 'open-material') {
    const materialId = element.dataset.materialId;
    state.selectedMaterial = materialId;

    if (materialId === 'mini-provas') {
      goTo('miniProvas');
    } else if (materialId === 'exercicios') {
      goTo('exerciciosMateria');
    } else if (materialId === 'assuntos') {
      goTo('assuntosMateria');
    }
    return;
  }

  if (action === 'select-mini-prova') {
    state.selectedMiniProvaType = element.dataset.provaType;
    goTo('miniProvasMateria');
    return;
  }

  if (action === 'select-material-subject') {
    const subjectName = element.dataset.subjectName;
    state.selectedSubject = { name: subjectName };
    goTo('whatsapp');
    return;
  }
}

function handleAssuntoSubmit() {
  const textarea = document.getElementById('subjectText');
  const validationMessage = document.getElementById('validationMessage');

  if (!textarea || !validationMessage) return;

  const text = textarea.value.trim();

  if (!text) {
    validationMessage.textContent = 'Informe o assunto antes de continuar.';
    textarea.focus();
    return;
  }

  validationMessage.textContent = '';
  const message = `Olá!\n\nGostaria de agendar uma aula.\n\nMatéria:\n${state.selectedSubject.name}\n\nAssunto:\n${text}`;
  openWhatsApp(message);
  goTo('home');
}

function attachEvents() {
  document.addEventListener('click', (event) => {
    handleRouteClick(event);
    handleActionClick(event);
  });

  appContainer.addEventListener('input', handleSubjectInput);

  document.addEventListener('click', (event) => {
    const button = event.target.closest('#continueAssunto');
    if (button) {
      handleAssuntoSubmit();
    }
  });
}

function init() {
  attachEvents();
  loadStoredUser();
  loadStoredAppointments();
  verifyTokenFromUrl().then(async () => {
    if (state.user) {
      await loadUserAppointments();
      render('home');
    } else {
      goTo('home');
    }
  });
}

init();
