// CRM Constants - Shared between client and server

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
  proposal_value: number | null
  status: CRMStatus
  created_at: string
  updated_at: string
  // Campo para identificar se é um cliente ou lead
  is_client?: boolean
  client_data?: {
    type: string
    plan: string
    monthly_value: number
  }
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
