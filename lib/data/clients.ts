"use server"

import { query, queryOne, execute } from "@/lib/db"
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
    let sql = "SELECT * FROM clients ORDER BY name"
    const params: unknown[] = []
    let paramCount = 1

    // Build WHERE clause based on filters
    const conditions: string[] = []

    if (filters?.status && filters.status !== "all") {
      conditions.push(`contract_status = $${paramCount}`)
      params.push(filters.status)
      paramCount++
    }

    if (filters?.type && filters.type !== "all") {
      conditions.push(`type = $${paramCount}`)
      params.push(filters.type)
      paramCount++
    }

    if (filters?.search) {
      conditions.push(`LOWER(name) LIKE LOWER($${paramCount})`)
      params.push(`%${filters.search}%`)
      paramCount++
    }

    if (conditions.length > 0) {
      sql = `SELECT * FROM clients WHERE ${conditions.join(" AND ")} ORDER BY name`
    }

    const clients = await query<Client>(sql, params)
    return clients
  } catch (error) {
    console.error("[v0] Error fetching clients:", error)
    return []
  }
}

export async function getClientById(id: string): Promise<ClientWithResponsibles | null> {
  try {
    const client = await queryOne<Client>(
      `SELECT * FROM clients WHERE id = $1`,
      [id]
    )

    if (!client) return null

    // Fetch responsibles for this client
    const responsibles = await query(
      `SELECT cr.area, cr.user_id, u.name as user_name 
       FROM client_responsibles cr 
       LEFT JOIN users u ON cr.user_id = u.id 
       WHERE cr.client_id = $1`,
      [id]
    )

    return {
      ...client,
      responsibles: responsibles || [],
    }
  } catch (error) {
    console.error("[v0] Error fetching client by id:", error)
    return null
  }
}

export async function createClient(data: Partial<Client>): Promise<Client | null> {
  try {
    const result = await queryOne<Client>(
      `INSERT INTO clients (
        name, type, campaign_type, plan, monthly_value, 
        contract_status, month_status, whatsapp_group_name, 
        whatsapp_group_id, ad_account_name, ad_account_id, 
        business_manager_id, google_ads_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        data.name,
        data.type,
        data.campaign_type,
        data.plan,
        data.monthly_value || 0,
        data.contract_status || "Ativo",
        data.month_status || "green",
        data.whatsapp_group_name || null,
        data.whatsapp_group_id || null,
        data.ad_account_name || null,
        data.ad_account_id || null,
        data.business_manager_id || null,
        data.google_ads_id || null,
        "Ativo",
      ]
    )

    if (!result) {
      throw new Error("Failed to create client")
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
    // Build dynamic UPDATE query
    const updates: string[] = []
    const params: unknown[] = []
    let paramCount = 1

    const fields: (keyof Client)[] = [
      'name', 'type', 'campaign_type', 'plan',
      'monthly_value', 'contract_status', 'month_status', 
      'whatsapp_group_name', 'whatsapp_group_id', 'ad_account_name', 
      'ad_account_id', 'business_manager_id', 'google_ads_id', 'status',
    ]

    for (const field of fields) {
      if (field in data) {
        updates.push(`${field} = $${paramCount}`)
        params.push(data[field])
        paramCount++
      }
    }

    if (updates.length === 0) {
      return await queryOne<Client>("SELECT * FROM clients WHERE id = $1", [id])
    }

    updates.push(`updated_at = NOW()`)
    params.push(id)

    const result = await queryOne<Client>(
      `UPDATE clients SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      params
    )

    if (!result) {
      throw new Error("Failed to update client")
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
    await execute("DELETE FROM clients WHERE id = $1", [id])

    // Send webhook notification
    await sendWebhookNotification('client.deleted', { id })
  } catch (error) {
    console.error("[v0] Error deleting client:", error)
    throw error
  }
}
