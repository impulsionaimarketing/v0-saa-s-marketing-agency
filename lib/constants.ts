// Etapas de um conteúdo na Produção (relação com o cliente)
export const PRODUCTION_STATUSES = [
  'Planejamento',
  'Aprovação da Ideia',
  'Captação',
  'Edição',
  'Aprovação do Cliente',
  'Solicitou Ajuste',
  'Programado',
  'Publicado',
] as const

export type ProductionStatus = (typeof PRODUCTION_STATUSES)[number]

// Rótulos de exibição (o valor gravado no banco continua sendo a chave)
export const PRODUCTION_STATUS_LABEL: Record<string, string> = {
  'Solicitou Ajuste': 'Ajustes',
}

// Status antigos → etapa equivalente (usado na migração e como fallback visual)
export const LEGACY_PRODUCTION_STATUS: Record<string, ProductionStatus> = {
  'Produção': 'Captação',
  'Revisão': 'Edição',
  'Legenda': 'Edição',
  'Aprovado': 'Programado',
  'Em Tráfego': 'Publicado',
  'Finalizado': 'Publicado',
}

// Resultado da decisão do cliente no link de aprovação
export function statusAfterClientDecision(current: string | null | undefined, approved: boolean): ProductionStatus {
  if (!approved) return 'Solicitou Ajuste'
  return current === 'Aprovação da Ideia' ? 'Captação' : 'Programado'
}

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
