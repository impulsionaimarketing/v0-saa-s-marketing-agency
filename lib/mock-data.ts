// Mock data for the marketing agency management platform

export interface Client {
  id: string
  name: string
  responsible: string
  type: 'Serviço' | 'Infoproduto' | 'Local'
  campaignType: 'Mensagem' | 'Venda' | 'Alcance'
  paymentFrequency: 'Semanal' | 'Quinzenal' | 'Mensal' | 'Bimestral' | 'Trimestral' | 'Anual'
  plan: string
  value: number
  contractStatus: 'Ativo' | 'Pausado' | 'Perdido'
  contractStartDate: string
  contractEndDate: string
  renewalDate: string
  monthStatus: 'green' | 'yellow' | 'red'
  whatsappGroup: { name: string; id: string }
  adAccount: { name: string; id: string }
  businessManagerId: string
  googleAdsId: string
  responsibles: {
    arte: string
    video: string
    trafego: string
    comunicacao: string
  }
}

export interface Payment {
  id: string
  clientId: string
  dueDate: string
  amount: number
  isPaid: boolean
  paidDate?: string
}

export interface Demand {
  id: string
  name: string
  clientId: string
  clientName: string
  area: 'Arte' | 'Vídeo' | 'Tráfego' | 'Comunicação'
  responsible: string
  deadline: string
  status: 'A Fazer' | 'Em Produção' | 'Em Revisão' | 'Aprovado' | 'Publicado' | 'Atrasado'
}

export interface Production {
  id: string
  clientId: string
  clientName: string
  type: 'Vídeo' | 'Arte'
  responsible: string
  status: 'Planejamento' | 'Aprovação do Cliente' | 'Captação' | 'Edição' | 'Revisão' | 'Legenda' | 'Programado' | 'Publicado' | 'Em Tráfego' | 'Finalizado'
  postDate: string
}

export interface Campaign {
  id: string
  clientId: string
  clientName: string
  name: string
  objective: string
  status: 'Ativo' | 'Pausado' | 'Finalizado'
  dailyBudget: number
  impressions: number
  clicks: number
  messages: number
  cpl: number
  cpa: number
  performance: 'green' | 'yellow' | 'red'
}

export interface Report {
  id: string
  clientId: string
  clientName: string
  month: string
  status: 'Enviado' | 'Pendente'
  results: string
}

export interface Collaborator {
  id: string
  name: string
  role: string
  areas: ('Arte' | 'Vídeo' | 'Tráfego' | 'Comunicação')[]
  activeDemands: number
  lateDemands: number
  status: 'Ativo' | 'Inativo'
  avatar: string
}

export interface Alert {
  id: string
  type: 'late_task' | 'no_balance' | 'blocked_account' | 'kpi_issue' | 'pending_report'
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  createdAt: string
  clientName?: string
}

export const clients: Client[] = [
  {
    id: '1',
    name: 'TechStart Solutions',
    responsible: 'Carlos Silva',
    type: 'Serviço',
    campaignType: 'Mensagem',
    paymentFrequency: 'Mensal',
    plan: 'Premium',
    value: 5500,
    contractStatus: 'Ativo',
    contractStartDate: '2025-01-15',
    contractEndDate: '2026-12-31',
    renewalDate: '2026-03-15',
    monthStatus: 'green',
    whatsappGroup: { name: 'TechStart - Suporte', id: '120363xxx' },
    adAccount: { name: 'TechStart Ads', id: 'act_123456789' },
    businessManagerId: 'bm_987654321',
    googleAdsId: '123-456-7890',
    responsibles: {
      arte: 'Ana Costa',
      video: 'Pedro Santos',
      trafego: 'Lucas Oliveira',
      comunicacao: 'Maria Souza',
    },
  },
  {
    id: '2',
    name: 'Bella Estética',
    responsible: 'Fernanda Lima',
    type: 'Local',
    campaignType: 'Mensagem',
    paymentFrequency: 'Quinzenal',
    plan: 'Standard',
    value: 3200,
    contractStatus: 'Ativo',
    contractStartDate: '2025-02-01',
    contractEndDate: '2026-12-31',
    renewalDate: '2026-02-28',
    monthStatus: 'yellow',
    whatsappGroup: { name: 'Bella - Marketing', id: '120363yyy' },
    adAccount: { name: 'Bella Estética Ads', id: 'act_234567890' },
    businessManagerId: 'bm_876543210',
    googleAdsId: '234-567-8901',
    responsibles: {
      arte: 'Ana Costa',
      video: 'Julia Mendes',
      trafego: 'Lucas Oliveira',
      comunicacao: 'Maria Souza',
    },
  },
  {
    id: '3',
    name: 'EduPro Academy',
    responsible: 'Roberto Alves',
    type: 'Infoproduto',
    campaignType: 'Venda',
    paymentFrequency: 'Mensal',
    plan: 'Enterprise',
    value: 8900,
    contractStatus: 'Ativo',
    contractStartDate: '2024-12-01',
    contractEndDate: '2027-12-31',
    renewalDate: '2026-04-10',
    monthStatus: 'green',
    whatsappGroup: { name: 'EduPro - Equipe', id: '120363zzz' },
    adAccount: { name: 'EduPro Academy Ads', id: 'act_345678901' },
    businessManagerId: 'bm_765432109',
    googleAdsId: '345-678-9012',
    responsibles: {
      arte: 'Bruno Dias',
      video: 'Pedro Santos',
      trafego: 'Camila Rocha',
      comunicacao: 'Thiago Ferreira',
    },
  },
  {
    id: '4',
    name: 'Sabor & Arte Restaurante',
    responsible: 'Patricia Gomes',
    type: 'Local',
    campaignType: 'Alcance',
    paymentFrequency: 'Semanal',
    plan: 'Basic',
    value: 1800,
    contractStatus: 'Pausado',
    contractStartDate: '2025-06-01',
    contractEndDate: '2026-05-31',
    renewalDate: '2026-01-20',
    monthStatus: 'red',
    whatsappGroup: { name: 'Sabor Arte - MKT', id: '120363aaa' },
    adAccount: { name: 'Sabor Arte Ads', id: 'act_456789012' },
    businessManagerId: 'bm_654321098',
    googleAdsId: '456-789-0123',
    responsibles: {
      arte: 'Ana Costa',
      video: 'Julia Mendes',
      trafego: 'Lucas Oliveira',
      comunicacao: 'Maria Souza',
    },
  },
  {
    id: '5',
    name: 'FitLife Academia',
    responsible: 'Marcos Ribeiro',
    type: 'Local',
    campaignType: 'Mensagem',
    paymentFrequency: 'Mensal',
    plan: 'Standard',
    value: 2800,
    contractStatus: 'Ativo',
    contractStartDate: '2025-03-01',
    contractEndDate: '2026-12-31',
    renewalDate: '2026-03-01',
    monthStatus: 'green',
    whatsappGroup: { name: 'FitLife - Redes', id: '120363bbb' },
    adAccount: { name: 'FitLife Ads', id: 'act_567890123' },
    businessManagerId: 'bm_543210987',
    googleAdsId: '567-890-1234',
    responsibles: {
      arte: 'Bruno Dias',
      video: 'Pedro Santos',
      trafego: 'Camila Rocha',
      comunicacao: 'Thiago Ferreira',
    },
  },
  {
    id: '6',
    name: 'Digital Mentors',
    responsible: 'Amanda Freitas',
    type: 'Infoproduto',
    campaignType: 'Venda',
    paymentFrequency: 'Trimestral',
    plan: 'Premium',
    value: 6500,
    contractStatus: 'Ativo',
    contractStartDate: '2025-01-01',
    contractEndDate: '2026-12-31',
    renewalDate: '2026-02-15',
    monthStatus: 'yellow',
    whatsappGroup: { name: 'Digital Mentors - Time', id: '120363ccc' },
    adAccount: { name: 'Digital Mentors Ads', id: 'act_678901234' },
    businessManagerId: 'bm_432109876',
    googleAdsId: '678-901-2345',
    responsibles: {
      arte: 'Ana Costa',
      video: 'Julia Mendes',
      trafego: 'Lucas Oliveira',
      comunicacao: 'Maria Souza',
    },
  },
]

export const demands: Demand[] = [
  { id: '1', name: 'Banner promoção Janeiro', clientId: '1', clientName: 'TechStart Solutions', area: 'Arte', responsible: 'Ana Costa', deadline: '2026-01-30', status: 'A Fazer' },
  { id: '2', name: 'Vídeo institucional', clientId: '1', clientName: 'TechStart Solutions', area: 'Vídeo', responsible: 'Pedro Santos', deadline: '2026-02-05', status: 'Em Produção' },
  { id: '3', name: 'Campanha de leads', clientId: '2', clientName: 'Bella Estética', area: 'Tráfego', responsible: 'Lucas Oliveira', deadline: '2026-01-28', status: 'Atrasado' },
  { id: '4', name: 'Posts Instagram Semana 5', clientId: '2', clientName: 'Bella Estética', area: 'Arte', responsible: 'Ana Costa', deadline: '2026-02-01', status: 'Em Revisão' },
  { id: '5', name: 'Copy página de vendas', clientId: '3', clientName: 'EduPro Academy', area: 'Comunicação', responsible: 'Thiago Ferreira', deadline: '2026-02-10', status: 'A Fazer' },
  { id: '6', name: 'VSL produto novo', clientId: '3', clientName: 'EduPro Academy', area: 'Vídeo', responsible: 'Pedro Santos', deadline: '2026-02-15', status: 'Em Produção' },
  { id: '7', name: 'Stories promocionais', clientId: '5', clientName: 'FitLife Academia', area: 'Arte', responsible: 'Bruno Dias', deadline: '2026-01-31', status: 'Aprovado' },
  { id: '8', name: 'Reels treino rápido', clientId: '5', clientName: 'FitLife Academia', area: 'Vídeo', responsible: 'Julia Mendes', deadline: '2026-02-03', status: 'Publicado' },
  { id: '9', name: 'Carrossel benefícios', clientId: '6', clientName: 'Digital Mentors', area: 'Arte', responsible: 'Ana Costa', deadline: '2026-01-25', status: 'Atrasado' },
  { id: '10', name: 'Email marketing', clientId: '6', clientName: 'Digital Mentors', area: 'Comunicação', responsible: 'Maria Souza', deadline: '2026-02-02', status: 'A Fazer' },
]

export const productions: Production[] = [
  { id: '1', clientId: '1', clientName: 'TechStart Solutions', type: 'Vídeo', responsible: 'Pedro Santos', status: 'Edição', postDate: '2026-02-10' },
  { id: '2', clientId: '1', clientName: 'TechStart Solutions', type: 'Arte', responsible: 'Ana Costa', status: 'Aprovação do Cliente', postDate: '2026-02-05' },
  { id: '3', clientId: '2', clientName: 'Bella Estética', type: 'Vídeo', responsible: 'Julia Mendes', status: 'Captação', postDate: '2026-02-08' },
  { id: '4', clientId: '2', clientName: 'Bella Estética', type: 'Arte', responsible: 'Ana Costa', status: 'Programado', postDate: '2026-02-01' },
  { id: '5', clientId: '3', clientName: 'EduPro Academy', type: 'Vídeo', responsible: 'Pedro Santos', status: 'Planejamento', postDate: '2026-02-20' },
  { id: '6', clientId: '3', clientName: 'EduPro Academy', type: 'Arte', responsible: 'Bruno Dias', status: 'Publicado', postDate: '2026-01-28' },
  { id: '7', clientId: '5', clientName: 'FitLife Academia', type: 'Vídeo', responsible: 'Julia Mendes', status: 'Em Tráfego', postDate: '2026-01-25' },
  { id: '8', clientId: '5', clientName: 'FitLife Academia', type: 'Arte', responsible: 'Bruno Dias', status: 'Revisão', postDate: '2026-02-03' },
  { id: '9', clientId: '6', clientName: 'Digital Mentors', type: 'Vídeo', responsible: 'Pedro Santos', status: 'Legenda', postDate: '2026-02-12' },
  { id: '10', clientId: '6', clientName: 'Digital Mentors', type: 'Arte', responsible: 'Ana Costa', status: 'Finalizado', postDate: '2026-01-20' },
]

export const campaigns: Campaign[] = [
  { id: '1', clientId: '1', clientName: 'TechStart Solutions', name: 'Leads Janeiro', objective: 'Mensagens', status: 'Ativo', dailyBudget: 150, impressions: 45000, clicks: 1200, messages: 280, cpl: 8.50, cpa: 45.00, performance: 'green' },
  { id: '2', clientId: '1', clientName: 'TechStart Solutions', name: 'Remarketing', objective: 'Conversões', status: 'Ativo', dailyBudget: 80, impressions: 25000, clicks: 800, messages: 120, cpl: 12.00, cpa: 65.00, performance: 'yellow' },
  { id: '3', clientId: '2', clientName: 'Bella Estética', name: 'Promoção Verão', objective: 'Mensagens', status: 'Ativo', dailyBudget: 100, impressions: 32000, clicks: 950, messages: 210, cpl: 7.20, cpa: 38.00, performance: 'green' },
  { id: '4', clientId: '3', clientName: 'EduPro Academy', name: 'Lançamento Curso', objective: 'Vendas', status: 'Ativo', dailyBudget: 300, impressions: 85000, clicks: 2800, messages: 450, cpl: 15.00, cpa: 120.00, performance: 'yellow' },
  { id: '5', clientId: '3', clientName: 'EduPro Academy', name: 'Captação Leads', objective: 'Cadastros', status: 'Ativo', dailyBudget: 200, impressions: 62000, clicks: 1900, messages: 380, cpl: 6.80, cpa: 42.00, performance: 'green' },
  { id: '6', clientId: '5', clientName: 'FitLife Academia', name: 'Matrícula Jan', objective: 'Mensagens', status: 'Ativo', dailyBudget: 80, impressions: 28000, clicks: 720, messages: 165, cpl: 9.50, cpa: 52.00, performance: 'green' },
  { id: '7', clientId: '6', clientName: 'Digital Mentors', name: 'Webinar Gratuito', objective: 'Cadastros', status: 'Pausado', dailyBudget: 150, impressions: 42000, clicks: 1400, messages: 290, cpl: 18.00, cpa: 95.00, performance: 'red' },
]

export const reports: Report[] = [
  { id: '1', clientId: '1', clientName: 'TechStart Solutions', month: 'Janeiro 2026', status: 'Enviado', results: '280 leads, R$ 45k faturamento' },
  { id: '2', clientId: '2', clientName: 'Bella Estética', month: 'Janeiro 2026', status: 'Pendente', results: '-' },
  { id: '3', clientId: '3', clientName: 'EduPro Academy', month: 'Janeiro 2026', status: 'Enviado', results: '85 vendas, R$ 127k faturamento' },
  { id: '4', clientId: '5', clientName: 'FitLife Academia', month: 'Janeiro 2026', status: 'Pendente', results: '-' },
  { id: '5', clientId: '6', clientName: 'Digital Mentors', month: 'Janeiro 2026', status: 'Enviado', results: '45 vendas, R$ 68k faturamento' },
  { id: '6', clientId: '1', clientName: 'TechStart Solutions', month: 'Dezembro 2025', status: 'Enviado', results: '245 leads, R$ 38k faturamento' },
  { id: '7', clientId: '2', clientName: 'Bella Estética', month: 'Dezembro 2025', status: 'Enviado', results: '180 leads, R$ 22k faturamento' },
]

export const collaborators: Collaborator[] = [
  { id: '1', name: 'Ana Costa', role: 'Designer Sênior', areas: ['Arte', 'Comunicação'], activeDemands: 4, lateDemands: 1, status: 'Ativo', avatar: 'AC' },
  { id: '2', name: 'Pedro Santos', role: 'Editor de Vídeo', areas: ['Vídeo'], activeDemands: 3, lateDemands: 0, status: 'Ativo', avatar: 'PS' },
  { id: '3', name: 'Lucas Oliveira', role: 'Gestor de Tráfego', areas: ['Tráfego'], activeDemands: 5, lateDemands: 1, status: 'Ativo', avatar: 'LO' },
  { id: '4', name: 'Maria Souza', role: 'Social Media', areas: ['Comunicação', 'Tráfego'], activeDemands: 2, lateDemands: 0, status: 'Ativo', avatar: 'MS' },
  { id: '5', name: 'Bruno Dias', role: 'Designer Pleno', areas: ['Arte'], activeDemands: 2, lateDemands: 0, status: 'Ativo', avatar: 'BD' },
  { id: '6', name: 'Julia Mendes', role: 'Videomaker', areas: ['Vídeo', 'Comunicação'], activeDemands: 2, lateDemands: 0, status: 'Ativo', avatar: 'JM' },
  { id: '7', name: 'Camila Rocha', role: 'Analista de Mídia', areas: ['Tráfego', 'Arte'], activeDemands: 3, lateDemands: 0, status: 'Ativo', avatar: 'CR' },
  { id: '8', name: 'Thiago Ferreira', role: 'Copywriter', areas: ['Comunicação'], activeDemands: 1, lateDemands: 0, status: 'Ativo', avatar: 'TF' },
  { id: '9', name: 'Rafael Martins', role: 'Designer Júnior', areas: ['Arte'], activeDemands: 0, lateDemands: 0, status: 'Inativo', avatar: 'RM' },
]

export const alerts: Alert[] = [
  { id: '1', type: 'late_task', title: 'Tarefa atrasada', description: 'Campanha de leads - Bella Estética', severity: 'high', createdAt: '2026-01-29T10:00:00', clientName: 'Bella Estética' },
  { id: '2', type: 'no_balance', title: 'Conta sem saldo', description: 'Conta de anúncios precisa de recarga', severity: 'high', createdAt: '2026-01-29T08:30:00', clientName: 'Digital Mentors' },
  { id: '3', type: 'kpi_issue', title: 'CPL acima da meta', description: 'Webinar Gratuito com CPL 80% acima', severity: 'medium', createdAt: '2026-01-29T07:00:00', clientName: 'Digital Mentors' },
  { id: '4', type: 'pending_report', title: 'Relatório pendente', description: 'Relatório de Janeiro não enviado', severity: 'medium', createdAt: '2026-01-28T18:00:00', clientName: 'Bella Estética' },
  { id: '5', type: 'late_task', title: 'Carrossel atrasado', description: 'Carrossel benefícios não entregue', severity: 'high', createdAt: '2026-01-28T14:00:00', clientName: 'Digital Mentors' },
  { id: '6', type: 'blocked_account', title: 'Conta bloqueada', description: 'Conta de anúncios com restrição', severity: 'high', createdAt: '2026-01-27T16:00:00', clientName: 'Sabor & Arte Restaurante' },
  { id: '7', type: 'pending_report', title: 'Relatório pendente', description: 'Relatório de Janeiro não enviado', severity: 'medium', createdAt: '2026-01-27T12:00:00', clientName: 'FitLife Academia' },
]

// Dashboard stats
export const dashboardStats = {
  activeClients: clients.filter(c => c.contractStatus === 'Ativo').length,
  openDemands: demands.filter(d => d.status !== 'Publicado').length,
  lateDemands: demands.filter(d => d.status === 'Atrasado').length,
  problematicAccounts: alerts.filter(a => a.type === 'no_balance' || a.type === 'blocked_account').length,
}

// Chart data
export const leadsPerDay = [
  { date: '23/01', leads: 42, messages: 156 },
  { date: '24/01', leads: 38, messages: 142 },
  { date: '25/01', leads: 55, messages: 189 },
  { date: '26/01', leads: 48, messages: 167 },
  { date: '27/01', leads: 62, messages: 215 },
  { date: '28/01', leads: 45, messages: 178 },
  { date: '29/01', leads: 58, messages: 198 },
]

export const investmentResults = [
  { month: 'Set', investment: 28000, results: 42000 },
  { month: 'Out', investment: 32000, results: 51000 },
  { month: 'Nov', investment: 35000, results: 58000 },
  { month: 'Dez', investment: 38000, results: 65000 },
  { month: 'Jan', investment: 42000, results: 72000 },
]

// User/Permission mock
export type UserRole = 'Admin' | 'Gestor' | 'Colaborador'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar: string
}

export const currentUser: User = {
  id: '1',
  name: 'João Administrador',
  email: 'joao@agencia.com',
  role: 'Admin',
  avatar: 'JA',
}

export const users: User[] = [
  currentUser,
  { id: '2', name: 'Maria Gestora', email: 'maria@agencia.com', role: 'Gestor', avatar: 'MG' },
  { id: '3', name: 'Pedro Colaborador', email: 'pedro@agencia.com', role: 'Colaborador', avatar: 'PC' },
]
