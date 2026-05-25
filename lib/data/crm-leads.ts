"use server"

import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import type { CRMLead, CRMStatus } from "./crm-constants"

// Mapeia o status do cliente para o status do CRM
function mapClientStatusToCRM(contractStatus: string): CRMStatus {
  switch (contractStatus) {
    case "Ativo":
      return "contrato_ativo"
    case "Pausado":
      return "contrato_pausado"
    case "Perdido":
      return "contrato_cancelado"
    default:
      return "contrato_ativo"
  }
}

export async function getCRMLeads(filters?: {
  status?: CRMStatus | "all"
  search?: string
}): Promise<CRMLead[]> {
  try {
    const supabase = await createSupabaseClient()

    // Busca leads do CRM
    let leadsQuery = supabase
      .from("crm_leads")
      .select("*")
      .order("created_at", { ascending: false })

    if (filters?.status && filters.status !== "all") {
      leadsQuery = leadsQuery.eq("status", filters.status)
    }

    if (filters?.search) {
      leadsQuery = leadsQuery.or(`name.ilike.%${filters.search}%,company.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    const { data: leadsData, error: leadsError } = await leadsQuery

    if (leadsError) {
      console.error("[v0] Supabase error fetching CRM leads:", leadsError.message)
    }

    const leads: CRMLead[] = (leadsData || []).map((lead) => ({
      ...lead,
      is_client: false,
    }))

    // Busca clientes da tabela clients
    let clientsQuery = supabase
      .from("clients")
      .select("*")
      .order("name")

    // Filtra por status do contrato se necessário
    if (filters?.status && filters.status !== "all") {
      if (filters.status === "contrato_ativo") {
        clientsQuery = clientsQuery.eq("contract_status", "Ativo")
      } else if (filters.status === "contrato_pausado") {
        clientsQuery = clientsQuery.eq("contract_status", "Pausado")
      } else if (filters.status === "contrato_cancelado") {
        clientsQuery = clientsQuery.eq("contract_status", "Perdido")
      } else {
        // Se filtrar por outro status (lead_novo, entrar_em_contato, proposta_enviada)
        // não incluir clientes
        const { data: clientsData, error: clientsError } = await clientsQuery.limit(0)
        return leads
      }
    }

    if (filters?.search) {
      clientsQuery = clientsQuery.ilike("name", `%${filters.search}%`)
    }

    const { data: clientsData, error: clientsError } = await clientsQuery

    if (clientsError) {
      console.error("[v0] Supabase error fetching clients:", clientsError.message)
    }

    // Converte clientes para o formato CRMLead
    const clientsAsLeads: CRMLead[] = (clientsData || []).map((client) => ({
      id: client.id,
      name: client.name,
      phone: null,
      email: null,
      company: client.name,
      source: "Cliente",
      notes: `${client.type} - ${client.plan}`,
      status: mapClientStatusToCRM(client.contract_status),
      created_at: client.created_at,
      updated_at: client.updated_at,
      is_client: true,
      client_data: {
        type: client.type,
        plan: client.plan,
        monthly_value: client.monthly_value,
      },
    }))

    // Combina leads e clientes
    return [...leads, ...clientsAsLeads]
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
