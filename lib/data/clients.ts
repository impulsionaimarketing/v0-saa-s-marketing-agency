"use server"

import { createClient } from "@/lib/supabase/server"
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
    const supabase = await createClient()
    
    let query = supabase
      .from("clients")
      .select("*")
      .order("name")

    if (filters?.status && filters.status !== "all") {
      query = query.eq("contract_status", filters.status)
    }

    if (filters?.type && filters.type !== "all") {
      query = query.eq("type", filters.type)
    }

    if (filters?.search) {
      query = query.ilike("name", `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching clients:", error)
      return []
    }

    return (data || []) as Client[]
  } catch (error) {
    console.error("[v0] Error fetching clients:", error)
    return []
  }
}

export async function getClientById(id: string): Promise<ClientWithResponsibles | null> {
  try {
    const supabase = await createClient()
    
    const { data: client, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !client) {
      console.error("[v0] Error fetching client by id:", error)
      return null
    }

    // Fetch responsibles for this client
    const { data: responsibles, error: respError } = await supabase
      .from("client_responsibles")
      .select(`
        area,
        user_id,
        users!inner (name)
      `)
      .eq("client_id", id)

    if (respError) {
      console.error("[v0] Error fetching client responsibles:", respError)
    }

    return {
      ...(client as Client),
      responsibles: responsibles?.map((r: any) => ({
        area: r.area,
        user_id: r.user_id,
        user_name: r.users?.name || "",
      })) || [],
    }
  } catch (error) {
    console.error("[v0] Error fetching client by id:", error)
    return null
  }
}

export async function createNewClient(data: Partial<Client>): Promise<Client | null> {
  try {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from("clients")
      .insert({
        name: data.name,
        type: data.type,
        campaign_type: data.campaign_type,
        plan: data.plan,
        monthly_value: data.monthly_value || 0,
        contract_status: data.contract_status || "Ativo",
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

    return result as Client
  } catch (error) {
    console.error("[v0] Error creating client:", error)
    throw error
  }
}

export async function updateClient(id: string, data: Partial<Client>): Promise<Client | null> {
  try {
    const supabase = await createClient()
    
    const updateData: any = {}
    const fields: (keyof Client)[] = [
      'name', 'type', 'campaign_type', 'plan',
      'monthly_value', 'contract_status', 'month_status', 
      'whatsapp_group_name', 'whatsapp_group_id', 'ad_account_name', 
      'ad_account_id', 'business_manager_id', 'google_ads_id', 'status',
    ]

    for (const field of fields) {
      if (field in data) {
        updateData[field] = data[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      const { data: client } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single()
      return (client as Client) || null
    }

    const { data: result, error } = await supabase
      .from("clients")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating client:", error)
      throw new Error(error.message)
    }

    // Send webhook notification
    await sendWebhookNotification('client.updated', { id, ...result })

    return result as Client
  } catch (error) {
    console.error("[v0] Error updating client:", error)
    throw error
  }
}

export async function deleteClient(id: string): Promise<void> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id)

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
