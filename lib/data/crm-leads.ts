"use server"

import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import type { CRMLead, CRMStatus, CRMCard } from "@/lib/data/crm-config"
import { CONTRACT_STATUS_TO_CRM, CRM_TO_CONTRACT_STATUS } from "@/lib/data/crm-config"

export async function getCRMLeads(filters?: {
  status?: CRMStatus | "all"
  search?: string
}): Promise<CRMLead[]> {
  try {
    const supabase = await createSupabaseClient()
    
    if (!supabase) {
      console.error("[v0] Failed to create Supabase client")
      return []
    }

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
      console.error("[v0] Error fetching CRM leads:", error)
      return []
    }

    return (data || []) as CRMLead[]
  } catch (error) {
    console.error("[v0] Error fetching CRM leads:", error)
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
  proposal_value?: number
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
        proposal_value: data.proposal_value ?? 0,
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

// ─── Cards unificados (leads do CRM + clientes da agência) ──────────────────────

// Converte um registro da tabela `clients` em um card do CRM
function clientToCRMCard(client: any): CRMCard {
  const primaryInstance = Array.isArray(client.whatsapp_instances)
    ? client.whatsapp_instances.find((i: any) => i?.is_primary) ?? client.whatsapp_instances[0]
    : null

  return {
    id: client.id,
    name: client.name,
    phone: primaryInstance?.phone_number ?? null,
    email: null,
    company: client.name,
    source: "Cliente",
    notes: null,
    proposal_value: 0,
    status: CONTRACT_STATUS_TO_CRM[client.contract_status] ?? "contrato_ativo",
    created_at: client.created_at,
    updated_at: client.updated_at,
    entity: "client",
    value: Number(client.monthly_value) || 0,
  }
}

// Retorna leads do CRM e clientes da agência combinados como cards
export async function getCRMCards(): Promise<CRMCard[]> {
  try {
    const supabase = await createSupabaseClient()

    if (!supabase) {
      console.error("[v0] Failed to create Supabase client")
      return []
    }

    const [leadsResult, clientsResult] = await Promise.all([
      supabase.from("crm_leads").select("*").order("created_at", { ascending: false }),
      supabase
        .from("clients")
        .select("id, name, contract_status, monthly_value, whatsapp_instances, created_at, updated_at")
        .order("name"),
    ])

    if (leadsResult.error) {
      console.error("[v0] Error fetching CRM leads:", leadsResult.error)
    }
    if (clientsResult.error) {
      console.error("[v0] Error fetching clients for CRM:", clientsResult.error)
    }

    const leadCards: CRMCard[] = (leadsResult.data || []).map((lead: any) => ({
      ...(lead as CRMLead),
      entity: "lead",
      value: Number(lead.proposal_value) || 0,
    }))

    const clientCards: CRMCard[] = (clientsResult.data || []).map(clientToCRMCard)

    return [...clientCards, ...leadCards]
  } catch (error) {
    console.error("[v0] Error fetching CRM cards:", error)
    return []
  }
}

// Atualiza o status de um card, roteando para a tabela correta
export async function updateCRMCardStatus(
  id: string,
  entity: "lead" | "client",
  newStatus: CRMStatus
): Promise<void> {
  if (entity === "client") {
    const contractStatus = CRM_TO_CONTRACT_STATUS[newStatus]
    // Clientes só podem ser movidos entre as colunas de contrato
    if (!contractStatus) {
      throw new Error("Clientes só podem ser movidos entre as colunas de contrato.")
    }
    try {
      const supabase = await createSupabaseClient()
      const { error } = await supabase
        .from("clients")
        .update({ contract_status: contractStatus, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) {
        console.error("[v0] Error updating client contract_status:", error)
        throw new Error(error.message)
      }
    } catch (error) {
      console.error("[v0] Error updating client contract_status:", error)
      throw error
    }
    return
  }

  await updateCRMLeadStatus(id, newStatus)
}
