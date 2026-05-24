"use server"

import { createClient as createSupabaseClient } from "@/lib/supabase/server"

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

export async function getCRMLeads(filters?: {
  status?: CRMStatus | "all"
  search?: string
}): Promise<CRMLead[]> {
  try {
    const supabase = await createSupabaseClient()

    let query = supabase
      .from("crm_leads")
      .select("*")
      .order("created_at", { ascending: false })

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,company.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Supabase error fetching CRM leads:", error.message)
      return []
    }

    return (data || []) as CRMLead[]
  } catch (error) {
    console.error("[v0] Exception fetching CRM leads:", error)
    return []
  }
}

export async function createCRMLead(data: {
  name: string
  phone?: string | null
  email?: string | null
  company?: string | null
  source?: string | null
  notes?: string | null
  status?: CRMStatus
}): Promise<CRMLead | null> {
  try {
    const supabase = await createSupabaseClient()

    const { data: result, error } = await supabase
      .from("crm_leads")
      .insert({
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        company: data.company || null,
        source: data.source || null,
        notes: data.notes || null,
        status: data.status || "lead_novo",
      })
      .select("*")
      .single()

    if (error) {
      console.error("[v0] Error creating CRM lead:", error)
      throw new Error(error.message)
    }

    return result as CRMLead
  } catch (error) {
    console.error("[v0] Error creating CRM lead:", error)
    throw error
  }
}

export async function updateCRMLead(
  id: string,
  data: Partial<Omit<CRMLead, "id" | "created_at">>
): Promise<CRMLead | null> {
  try {
    const supabase = await createSupabaseClient()

    const { data: result, error } = await supabase
      .from("crm_leads")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      console.error("[v0] Error updating CRM lead:", error)
      throw new Error(error.message)
    }

    return result as CRMLead
  } catch (error) {
    console.error("[v0] Error updating CRM lead:", error)
    throw error
  }
}

export async function updateCRMLeadStatus(id: string, status: CRMStatus): Promise<void> {
  try {
    const supabase = await createSupabaseClient()

    const { error } = await supabase
      .from("crm_leads")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("[v0] Error updating CRM lead status:", error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error("[v0] Error updating CRM lead status:", error)
    throw error
  }
}

export async function deleteCRMLead(id: string): Promise<void> {
  try {
    const supabase = await createSupabaseClient()

    const { error } = await supabase.from("crm_leads").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting CRM lead:", error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error("[v0] Error deleting CRM lead:", error)
    throw error
  }
}
