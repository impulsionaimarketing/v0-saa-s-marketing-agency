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
      proposal_value: lead.proposal_value || null,
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
      proposal_value: client.monthly_value || null,
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
  proposal_value?: number | null
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
        proposal_value: data.proposal_value || null,
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
    
    // Filter only valid table columns (exclude is_client and client_data which are computed)
    const updateData = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.company !== undefined && { company: data.company }),
      ...(data.source !== undefined && { source: data.source }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.proposal_value !== undefined && { proposal_value: data.proposal_value }),
      ...(data.status !== undefined && { status: data.status }),
      updated_at: new Date().toISOString(),
    }
    
    console.log("[v0] Updating lead with data:", updateData)

    const { data: result, error } = await supabase
      .from("crm_leads")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      console.error("[v0] Error updating CRM lead:", error)
      throw new Error(error.message)
    }
    
    console.log("[v0] Lead updated successfully:", result)

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

// Converte um lead em cliente (quando move para contrato_ativo)
export async function convertLeadToClient(leadId: string, clientData: {
  type: string
  plan: string
  monthly_value: number
  campaign_type?: string
}): Promise<string | null> {
  try {
    const supabase = await createSupabaseClient()

    // Busca o lead
    const { data: lead, error: leadError } = await supabase
      .from("crm_leads")
      .select("*")
      .eq("id", leadId)
      .single()

    if (leadError || !lead) {
      console.error("[v0] Error fetching lead for conversion:", leadError)
      throw new Error("Lead não encontrado")
    }

    // Cria o cliente
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        name: lead.name,
        type: clientData.type,
        campaign_type: clientData.campaign_type || "Mensagem",
        plan: clientData.plan,
        monthly_value: clientData.monthly_value,
        contract_status: "Ativo",
        month_status: "green",
      })
      .select("id")
      .single()

    if (clientError) {
      console.error("[v0] Error creating client from lead:", clientError)
      throw new Error(clientError.message)
    }

    // Remove o lead
    const { error: deleteError } = await supabase
      .from("crm_leads")
      .delete()
      .eq("id", leadId)

    if (deleteError) {
      console.error("[v0] Error deleting converted lead:", deleteError)
    }

    return client?.id || null
  } catch (error) {
    console.error("[v0] Error converting lead to client:", error)
    throw error
  }
}

// Atualiza o status do cliente na tabela clients
export async function updateClientContractStatus(clientId: string, status: "Ativo" | "Pausado" | "Perdido"): Promise<void> {
  try {
    const supabase = await createSupabaseClient()

    const { error } = await supabase
      .from("clients")
      .update({ 
        contract_status: status, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", clientId)

    if (error) {
      console.error("[v0] Error updating client contract status:", error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error("[v0] Error updating client contract status:", error)
    throw error
  }
}
