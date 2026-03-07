"use server"

import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import { sendWebhookNotification } from "@/lib/webhooks/send-notification"

export interface WhatsAppInstance {
  instance_name: string
  phone_number: string
  evolution_instance_id: string
  pixel_mensagem: string
  status: 'connected' | 'disconnected' | 'pending'
  is_primary: boolean
}

export interface Client {
  id: string
  name: string
  type: "Serviço" | "Infoproduto" | "Local"
  campaign_type: "Mensagem" | "Venda" | "Alcance"
  payment_frequency: "Semanal" | "Quinzenal" | "Mensal" | "Bimestral" | "Trimestral" | "Anual"
  plan: string
  monthly_value: number
  payment_day: number
  contract_status: "Ativo" | "Pausado" | "Perdido"
  contract_start_date: string | null
  contract_end_date: string | null
  renewal_date: string | null
  month_status: "green" | "yellow" | "red"
  whatsapp_instances: WhatsAppInstance[] | null
  whatsapp_group_name: string | null
  whatsapp_group_id: string | null
  ad_account_name: string | null
  ad_account_id: string | null
  business_manager_id: string | null
  google_ads_id: string | null
  status: "Ativo" | "Inativo"
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

    const { data: result, error } = await supabase
      .from("clients")
      .insert({
        name: data.name,
        type: data.type,
        campaign_type: data.campaign_type,
        payment_frequency: data.payment_frequency || "Mensal",
        plan: data.plan,
        monthly_value: data.monthly_value,
        payment_day: data.payment_day || 10,
        contract_status: data.contract_status || "Ativo",
        contract_start_date: data.contract_start_date || null,
        contract_end_date: data.contract_end_date || null,
        renewal_date: data.renewal_date || null,
        month_status: data.month_status || "green",
        whatsapp_group_name: data.whatsapp_group_name || null,
        whatsapp_group_id: data.whatsapp_group_id || null,
        ad_account_name: data.ad_account_name || null,
        ad_account_id: data.ad_account_id || null,
        business_manager_id: data.business_manager_id || null,
        google_ads_id: data.google_ads_id || null,
        status: "Ativo",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating client:", error)
      throw new Error(error.message)
    }

    // Send webhook notification
    await sendWebhookNotification('client.created', result)

    return result
  } catch (error) {
    console.error("[v0] Error creating client:", error)
    throw error
  }
}

export async function updateClient(id: string, data: Partial<Client>): Promise<Client | null> {
  try {
    const supabase = await createSupabaseClient()

    // Build payload with only the fields explicitly provided
    const payload: Record<string, unknown> = {}
    const fields: (keyof Client)[] = [
      'name', 'type', 'campaign_type', 'payment_frequency', 'plan',
      'monthly_value', 'payment_day', 'contract_status', 'contract_start_date',
      'contract_end_date', 'renewal_date', 'month_status', 'whatsapp_group_name',
      'whatsapp_group_id', 'whatsapp_instances', 'ad_account_name', 'ad_account_id',
      'business_manager_id', 'google_ads_id', 'status',
    ]
    for (const field of fields) {
      if (field in data) payload[field] = data[field]
    }

    const { data: result, error } = await supabase
      .from("clients")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating client:", error)
      throw new Error(error.message)
    }

    // Send webhook notification
    await sendWebhookNotification('client.updated', { id, ...result })

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

    // Send webhook notification
    await sendWebhookNotification('client.deleted', { id })
  } catch (error) {
    console.error("[v0] Error deleting client:", error)
    throw error
  }
}
