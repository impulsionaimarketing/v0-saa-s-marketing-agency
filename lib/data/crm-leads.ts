"use server"

import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import type { CRMLead, CRMStatus, CRMCard, ClientService } from "@/lib/data/crm-config"
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
  recurring_value?: number
  specific_value?: number
  services?: string[]
  status?: CRMStatus
  responsible_id?: string | null
}): Promise<CRMLead | null> {
  try {
    const supabase = await createSupabaseClient()

    const hasSplit = data.recurring_value !== undefined || data.specific_value !== undefined
    const recurring = Number(data.recurring_value) || 0
    const specific = Number(data.specific_value) || 0
    const base = {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      company: data.company || null,
      source: data.source || null,
      notes: data.notes || null,
      // proposal_value continua sendo o total (recorrente + específico)
      proposal_value: hasSplit ? recurring + specific : data.proposal_value ?? 0,
      services: data.services ?? [],
      status: data.status || "lead_novo",
    }

    const withResponsible: Record<string, unknown> = data.responsible_id ? { ...base, responsible_id: data.responsible_id } : base
    const row: Record<string, unknown> = hasSplit ? { ...withResponsible, recurring_value: recurring, specific_value: specific } : withResponsible
    let { data: result, error } = await supabase
      .from("crm_leads")
      .insert(row)
      .select("*")
      .single()

    // Banco ainda sem as colunas novas: grava só o total
    if (error && hasSplit && /recurring_value|specific_value/.test(error.message)) {
      ;({ data: result, error } = await supabase.from("crm_leads").insert(base).select("*").single())
    }
    // Banco ainda sem a coluna de responsável: grava sem ela
    if (error && /responsible_id/.test(error.message)) {
      const { responsible_id, ...rest } = row
      ;({ data: result, error } = await supabase.from("crm_leads").insert(rest).select("*").single())
    }

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

    const payload: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() }
    if (data.recurring_value !== undefined || data.specific_value !== undefined) {
      payload.proposal_value = (Number(data.recurring_value) || 0) + (Number(data.specific_value) || 0)
    }

    let { data: result, error } = await supabase
      .from("crm_leads")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single()

    // Banco ainda sem as colunas novas: atualiza só o total
    if (error && /recurring_value|specific_value/.test(error.message)) {
      const { recurring_value, specific_value, ...rest } = payload
      ;({ data: result, error } = await supabase.from("crm_leads").update(rest).eq("id", id).select("*").single())
    }

    // Banco ainda sem a coluna de responsável: atualiza sem ela
    if (error && /responsible_id/.test(error.message)) {
      const { responsible_id, ...rest } = payload
      ;({ data: result, error } = await supabase.from("crm_leads").update(rest).eq("id", id).select("*").single())
    }

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

  const services: ClientService[] = (Array.isArray(client.services) ? client.services : [])
    .filter((s: any) => s && s.name)
    .map((s: any) => ({
      name: String(s.name),
      kind: s.kind === "especifico" ? "especifico" : "recorrente",
      value: Number(s.value) || 0,
    }))
  const specificValue = services.filter((s) => s.kind === "especifico").reduce((a, s) => a + s.value, 0)
  // Sem serviços detalhados, o valor mensal do cadastro conta como recorrente
  const recurringValue =
    services.length > 0
      ? services.filter((s) => s.kind === "recorrente").reduce((a, s) => a + s.value, 0)
      : Number(client.monthly_value) || 0

  return {
    id: client.id,
    name: client.name,
    phone: primaryInstance?.phone_number ?? null,
    email: null,
    company: client.name,
    source: "Cliente",
    notes: null,
    proposal_value: 0,
    services: services.map((s) => s.name),
    status: CONTRACT_STATUS_TO_CRM[client.contract_status] ?? "contrato_ativo",
    created_at: client.created_at,
    updated_at: client.updated_at,
    entity: "client",
    value: recurringValue + specificValue,
    clientServices: services,
    recurringValue,
    specificValue,
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

    const clientCols = "id, name, contract_status, monthly_value, whatsapp_instances, created_at, updated_at"
    const [leadsResult, clientsWithServices, usersResult] = await Promise.all([
      supabase.from("crm_leads").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select(`${clientCols}, services`).order("name"),
      supabase.from("users").select("id, name"),
    ])
    const userNames = new Map<string, string>((usersResult.data || []).map((u: any) => [u.id, u.name]))
    // Se a coluna `services` ainda não existe no banco, volta ao select antigo
    const clientsResult = clientsWithServices.error
      ? await supabase.from("clients").select(clientCols).order("name")
      : clientsWithServices

    if (leadsResult.error) {
      console.error("[v0] Error fetching CRM leads:", leadsResult.error)
    }
    if (clientsResult.error) {
      console.error("[v0] Error fetching clients for CRM:", clientsResult.error)
    }

    const leadCards: CRMCard[] = (leadsResult.data || []).map((lead: any) => {
      const proposal = Number(lead.proposal_value) || 0
      let recurringValue = Number(lead.recurring_value) || 0
      const specificValue = Number(lead.specific_value) || 0
      // Lead antigo, sem divisão: o valor da proposta conta como recorrente
      if (recurringValue === 0 && specificValue === 0) recurringValue = proposal
      return {
        ...(lead as CRMLead),
        responsible_name: lead.responsible_id ? userNames.get(lead.responsible_id) ?? null : null,
        services: Array.isArray(lead.services) ? lead.services : [],
        entity: "lead",
        value: recurringValue + specificValue,
        recurringValue,
        specificValue,
      } as CRMCard
    })

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
