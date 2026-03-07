// Production statuses for the pipeline
export const PRODUCTION_STATUSES = [
  'Planejamento',
  'Aprovação do Cliente',
  'Captação',
  'Edição',
  'Revisão',
  'Legenda',
  'Programado',
  'Publicado',
  'Em Tráfego',
  'Finalizado',
] as const

export type ProductionStatus = (typeof PRODUCTION_STATUSES)[number]

// Demand statuses for the kanban
export const DEMAND_STATUSES = [
  'A Fazer',
  'Em Produção',
  'Em Revisão',
  'Aprovado',
  'Publicado',
  'Atrasado',
] as const

export type DemandStatus = (typeof DEMAND_STATUSES)[number]

// User roles
export const USER_ROLES = ['Admin', 'Gestor', 'Colaborador'] as const
export type UserRole = (typeof USER_ROLES)[number]

// User areas
export const USER_AREAS = ['Arte', 'Vídeo', 'Tráfego', 'Comunicação'] as const
export type UserArea = (typeof USER_AREAS)[number]

// Client types
export const CLIENT_TYPES = ['Serviço', 'Infoproduto', 'Local'] as const
export type ClientType = (typeof CLIENT_TYPES)[number]

// Campaign types
export const CAMPAIGN_TYPES = ['Mensagem', 'Venda', 'Alcance'] as const
export type CampaignType = (typeof CAMPAIGN_TYPES)[number]

// Contract statuses
export const CONTRACT_STATUSES = ['Ativo', 'Pausado', 'Perdido'] as const
export type ContractStatus = (typeof CONTRACT_STATUSES)[number]
