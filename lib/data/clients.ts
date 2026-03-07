"use server"

import { createClient as createSupabaseClient } from "@/lib/supabase/server"

export interface Client {
  id: string
  name: string
  type: "Serviço" | "Infoproduto" | "Local"
  campaign_type: "Mensagem" | "Venda" | "Alcance"
  payment_frequency: "Semanal" | "Quinzenal" | "Mensal" | "Bimestral" | "Trimestral" | "Anual"
  plan: string
  monthly_value: number
  contract_status: "Ativo" | "Pausado" | "Perdido"
  contract_start_date: string | null
  contract_end_date: string | null
  renewal_date: string | null
  month_status: "green" | "yellow" | "red"
  whatsapp_group_name: string | null
  whatsapp_group_id: string | null
  ad_account_name: string | null
  ad_account_id: string | null
  business_manager_id: string | null
  google_ads_id: string | null
  created_at: string
  updated_at: string
}

export interface ClientWithResponsibles extends Client {
  responsibles: {
    area: string
    user_id: string
    user_name: string
  }[]
}

export async function getClients(filters?: {
  status?: string
  type?: string
  search?: string
}): Promise<Client[]> {
  try {
    const supabase = await createSupabaseClient()
    
    // Use RPC function to bypass PostgREST cache
    const { data, error } = await supabase.rpc("get_all_clients")

    if (error) {
      console.error("[v0] Error fetching clients via RPC:", error)
      return []
    }

    let clients = data || []

    // Apply filters client-side
    if (filters?.status && filters.status !== "all") {
      clients = clients.filter((c: Client) => c.contract_status === filters.status)
    }

    if (filters?.type && filters.type !== "all") {
      clients = clients.filter((c: Client) => c.type === filters.type)
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase()
      clients = clients.filter((c: Client) => c.name.toLowerCase().includes(search))
    }

    // Sort by name
    clients.sort((a: Client, b: Client) => a.name.localeCompare(b.name))

    return clients
  } catch (error) {
    console.error("[v0] Error fetching clients:", error)
    return []
  }
}

export async function getClientById(id: string): Promise<ClientWithResponsibles | null> {
  try {
    const supabase = await createSupabaseClient()

    const { data: clients, error } = await supabase.rpc("get_all_clients")

    if (error || !clients) {
      console.error("[v0] Error fetching client by id:", error)
      return null
    }

    const client = clients.find((c: Client) => c.id === id)
    if (!client) return null

    return {
      ...client,
      responsibles: [],
    }
  } catch (error) {
    console.error("[v0] Error fetching client by id:", error)
    return null
  }
}

export async function createClient(data: Partial<Client>): Promise<Client | null> {
  try {
    const supabase = await createSupabaseClient()

    const { data: result, error } = await supabase.rpc("insert_client", {
      p_name: data.name,
      p_type: data.type,
      p_campaign_type: data.campaign_type,
      p_plan: data.plan,
      p_monthly_value: data.monthly_value,
      p_contract_status: data.contract_status || "Ativo",
      p_renewal_date: data.renewal_date || null,
      p_month_status: data.month_status || "green",
      p_whatsapp_group_name: data.whatsapp_group_name || null,
      p_whatsapp_group_id: data.whatsapp_group_id || null,
      p_ad_account_name: data.ad_account_name || null,
      p_ad_account_id: data.ad_account_id || null,
      p_business_manager_id: data.business_manager_id || null,
      p_google_ads_id: data.google_ads_id || null,
    })

    if (error) {
      console.error("[v0] Error creating client:", error)
      throw new Error(error.message)
    }

    return result
  } catch (error) {
    console.error("[v0] Error creating client:", error)
    throw error
  }
}

export async function updateClient(id: string, data: Partial<Client>): Promise<Client | null> {
  try {
    const supabase = await createSupabaseClient()

    const { data: result, error } = await supabase.rpc("update_client", {
      p_id: id,
      p_name: data.name,
      p_type: data.type,
      p_campaign_type: data.campaign_type,
      p_plan: data.plan,
      p_monthly_value: data.monthly_value,
      p_contract_status: data.contract_status,
      p_renewal_date: data.renewal_date,
      p_month_status: data.month_status,
      p_whatsapp_group_name: data.whatsapp_group_name,
      p_whatsapp_group_id: data.whatsapp_group_id,
      p_ad_account_name: data.ad_account_name,
      p_ad_account_id: data.ad_account_id,
      p_business_manager_id: data.business_manager_id,
      p_google_ads_id: data.google_ads_id,
    })

    if (error) {
      console.error("[v0] Error updating client:", error)
      throw new Error(error.message)
    }

    return result
  } catch (error) {
    console.error("[v0] Error updating client:", error)
    throw error
  }
}

export async function deleteClient(id: string): Promise<void> {
  try {
    const supabase = await createSupabaseClient()

    const { error } = await supabase.rpc("delete_client_by_id", { p_id: id })

    if (error) {
      console.error("[v0] Error deleting client:", error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error("[v0] Error deleting client:", error)
    throw error
  }
}
