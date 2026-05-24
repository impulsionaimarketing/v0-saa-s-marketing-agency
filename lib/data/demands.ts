"use server"

import { createClient } from "@/lib/supabase/server"
import { sendWebhookNotification } from "@/lib/webhooks/send-notification"

export interface Demand {
  id: string
  name: string
  description: string | null
  client_id: string
  client_name?: string
  area: "Arte" | "Vídeo" | "Tráfego" | "Comunicação"
  responsible_id: string | null
  responsible_name?: string
  deadline: string | null
  status: "A Fazer" | "Em Produção" | "Em Revisão" | "Aprovado" | "Publicado" | "Atrasado"
  priority: "low" | "medium" | "high"
  created_at: string
  updated_at: string
}

export async function getDemands(filters?: {
  client_id?: string
  area?: string
  status?: string
  responsible_id?: string
  current_user_id?: string
  current_user_role?: string
}): Promise<Demand[]> {
  try {
    const supabase = await createClient()

    // First get demands
    let query = supabase.from("demands").select("*")

    // Filter by user role: Colaboradores only see their own tasks
    if (filters?.current_user_role === 'Colaborador' && filters?.current_user_id) {
      query = query.eq("responsible_id", filters.current_user_id)
    }

    if (filters?.client_id) {
      query = query.eq("client_id", filters.client_id)
    }

    if (filters?.area && filters.area !== "all") {
      query = query.eq("area", filters.area)
    }

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.responsible_id) {
      query = query.eq("responsible_id", filters.responsible_id)
    }

    query = query.order("deadline", { ascending: true, nullsFirst: false })

    const { data: demands, error } = await query

    if (error) {
      console.error("[v0] Error fetching demands:", error)
      return []
    }

    if (!demands || demands.length === 0) return []

    // Get client and user names
    const clientIds = [...new Set(demands.map(d => d.client_id).filter(Boolean))]
    const userIds = [...new Set(demands.map(d => d.responsible_id).filter(Boolean))]

    const [clientsRes, usersRes] = await Promise.all([
      clientIds.length > 0 
        ? supabase.from("clients").select("id, name").in("id", clientIds)
        : { data: [] },
      userIds.length > 0
        ? supabase.from("users").select("id, name").in("id", userIds)
        : { data: [] }
    ])

    const clientMap = new Map((clientsRes.data || []).map(c => [c.id, c.name]))
    const userMap = new Map((usersRes.data || []).map(u => [u.id, u.name]))

    return demands.map(d => ({
      ...d,
      client_name: d.client_id ? clientMap.get(d.client_id) : undefined,
      responsible_name: d.responsible_id ? userMap.get(d.responsible_id) : undefined,
    }))
  } catch (error) {
    console.error("[v0] Error fetching demands:", error)
    return []
  }
}

export async function getDemandsByStatus(): Promise<Record<string, Demand[]>> {
  const demands = await getDemands()

  const grouped: Record<string, Demand[]> = {
    "A Fazer": [],
    "Em Produção": [],
    "Em Revisão": [],
    Aprovado: [],
    Publicado: [],
    Atrasado: [],
  }

  for (const demand of demands) {
    if (grouped[demand.status]) {
      grouped[demand.status].push(demand)
    }
  }

  return grouped
}

export async function createDemand(data: Partial<Demand>): Promise<Demand | null> {
  try {
    const supabase = await createClient()

    const { data: result, error } = await supabase
      .from("demands")
      .insert({
        name: data.name,
        description: data.description || null,
        client_id: data.client_id,
        area: data.area,
        responsible_id: data.responsible_id || null,
        deadline: data.deadline || null,
        status: data.status || "A Fazer",
        priority: data.priority || "medium",
      })
      .select()
      .single()

    if (error || !result) {
      console.error("[v0] Error creating demand:", error)
      throw new Error("Failed to create demand")
    }

    // Send webhook notification
    await sendWebhookNotification('demand.created', result)

    return result
  } catch (error) {
    console.error("[v0] Error creating demand:", error)
    throw error
  }
}

export async function updateDemand(id: string, data: Partial<Demand>): Promise<Demand | null> {
  try {
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {}
    const fields: (keyof Demand)[] = ['name', 'description', 'client_id', 'area', 'responsible_id', 'deadline', 'status', 'priority']

    for (const field of fields) {
      if (field in data) {
        updateData[field] = data[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      const { data: existing } = await supabase
        .from("demands")
        .select("*")
        .eq("id", id)
        .single()
      return existing
    }

    updateData.updated_at = new Date().toISOString()

    const { data: result, error } = await supabase
      .from("demands")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error || !result) {
      console.error("[v0] Error updating demand:", error)
      throw new Error("Failed to update demand")
    }

    // Check if there's a production linked to this demand and sync
    const { data: linkedProduction } = await supabase
      .from("productions")
      .select("id")
      .eq("demand_id", id)
      .single()

    if (linkedProduction) {
      console.log('[v0] Syncing demand changes to linked production:', linkedProduction.id)
      await supabase
        .from("productions")
        .update({
          responsible_id: data.responsible_id,
          status: mapDemandStatusToProductionStatus(data.status),
          post_date: data.deadline,
          updated_at: new Date().toISOString(),
        })
        .eq("id", linkedProduction.id)
    }

    // Send webhook notification
    await sendWebhookNotification('demand.updated', { id, ...result })

    return result
  } catch (error) {
    console.error("[v0] Error updating demand:", error)
    throw error
  }
}

// Helper function to map demand status to production status
function mapDemandStatusToProductionStatus(demandStatus?: string): string {
  const statusMap: Record<string, string> = {
    'A Fazer': 'Planejamento',
    'Em Produção': 'Produção',
    'Em Revisão': 'Revisão',
    'Aprovado': 'Aprovado',
    'Publicado': 'Publicado'
  }
  return demandStatus ? (statusMap[demandStatus] || 'Planejamento') : 'Planejamento'
}

export async function updateDemandStatus(id: string, status: Demand["status"]): Promise<Demand | null> {
  try {
    const supabase = await createClient()

    const { data: result, error } = await supabase
      .from("demands")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error || !result) {
      console.error("[v0] Error updating demand status:", error)
      throw new Error("Failed to update demand status")
    }

    // Send webhook notification
    await sendWebhookNotification('demand.status_changed', { id, status, ...result })

    return result
  } catch (error) {
    console.error("[v0] Error updating demand status:", error)
    throw error
  }
}

export async function deleteDemand(id: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("demands")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[v0] Error deleting demand:", error)
      throw error
    }

    // Send webhook notification
    await sendWebhookNotification('demand.deleted', { id })
  } catch (error) {
    console.error("[v0] Error deleting demand:", error)
    throw error
  }
}
