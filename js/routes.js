// Configuração das rotas da aplicação SPA.
export const ROUTE_CONFIG = {
  home: {
    title: 'Início',
    progress: 0,
    showBack: false,
    flow: 'home'
  },
  agendamento: {
    title: 'Escolha a matéria',
    progress: 1,
    showBack: true,
    flow: 'agendamento'
  },
  assunto: {
    title: 'Me fale o assunto',
    progress: 2,
    showBack: true,
    flow: 'agendamento'
  },
  materiais: {
    title: 'Materiais de preparação',
    progress: 1,
    showBack: true,
    flow: 'materiais'
  },
  miniProvas: {
    title: 'Mini Provas',
    progress: 2,
    showBack: true,
    flow: 'materiais'
  },
  miniProvasMateria: {
    title: 'Escolher matéria',
    progress: 3,
    showBack: true,
    flow: 'materiais'
  },
  exerciciosMateria: {
    title: 'Escolher matéria',
    progress: 2,
    showBack: true,
    flow: 'materiais'
  },
  assuntosMateria: {
    title: 'Escolher matéria',
    progress: 2,
    showBack: true,
    flow: 'materiais'
  },
  agendamentoDados: {
    title: 'Dados do agendamento',
    progress: 1,
    showBack: true,
    flow: 'agendamento'
  },
  agendamentoData: {
    title: 'Escolher data',
    progress: 2,
    showBack: true,
    flow: 'agendamento'
  },
  agendamentoHorario: {
    title: 'Escolher horário',
    progress: 3,
    showBack: true,
    flow: 'agendamento'
  },
  agendamentoConfirmacao: {
    title: 'Confirmação',
    progress: 4,
    showBack: true,
    flow: 'agendamento'
  },
  login: {
    title: 'Entrar',
    progress: 0,
    showBack: false,
    flow: 'auth'
  },
  whatsapp: {
    title: 'WhatsApp',
    progress: 0,
    showBack: true,
    flow: 'whatsapp'
  }
};
