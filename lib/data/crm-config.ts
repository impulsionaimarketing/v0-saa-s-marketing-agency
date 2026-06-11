export type CRMStatus = 
  | "lead_novo"
  | "entrar_em_contato"
  | "proposta_enviada"
  | "contrato_ativo"
  | "contrato_pausado"
  | "contrato_cancelado"

export interface CRMLead {
  id: string
  name: string
  phone: string | null
  email: string | null
  company: string | null
  source: string | null
  notes: string | null
  proposal_value: number
  status: CRMStatus
  created_at: string
  updated_at: string
}

export const CRM_STATUS_CONFIG: Record<CRMStatus, { label: string; color: string }> = {
  lead_novo: { label: "Lead Novo", color: "bg-chart-2/20 text-chart-2 border-chart-2/30" },
  entrar_em_contato: { label: "Entrar em Contato", color: "bg-warning/20 text-warning border-warning/30" },
  proposta_enviada: { label: "Proposta Enviada", color: "bg-chart-4/20 text-chart-4 border-chart-4/30" },
  contrato_ativo: { label: "Contrato Ativo", color: "bg-success/20 text-success border-success/30" },
  contrato_pausado: { label: "Contrato Pausado", color: "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30" },
  contrato_cancelado: { label: "Contrato Cancelado", color: "bg-destructive/20 text-destructive border-destructive/30" },
}

export const CRM_COLUMNS: { id: CRMStatus; title: string }[] = [
  { id: "lead_novo", title: "Lead Novo" },
  { id: "entrar_em_contato", title: "Entrar em Contato" },
  { id: "proposta_enviada", title: "Proposta Enviada" },
  { id: "contrato_ativo", title: "Contrato Ativo" },
  { id: "contrato_pausado", title: "Contrato Pausado" },
  { id: "contrato_cancelado", title: "Contrato Cancelado" },
]

// Mapeia o contract_status da tabela `clients` para as colunas do CRM
export const CONTRACT_STATUS_TO_CRM: Record<string, CRMStatus> = {
  Ativo: "contrato_ativo",
  Pausado: "contrato_pausado",
  Perdido: "contrato_cancelado",
}

// Mapeia as colunas do CRM de volta para o contract_status da tabela `clients`
export const CRM_TO_CONTRACT_STATUS: Partial<Record<CRMStatus, "Ativo" | "Pausado" | "Perdido">> = {
  contrato_ativo: "Ativo",
  contrato_pausado: "Pausado",
  contrato_cancelado: "Perdido",
}

// Card unificado do kanban: pode ser um lead do CRM ou um cliente da agência
export interface CRMCard extends CRMLead {
  entity: "lead" | "client"
  // Valor unificado: proposal_value (lead) ou monthly_value (cliente)
  value: number
}

// Formata um número como moeda brasileira (R$)
export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0)
}
