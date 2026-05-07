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
    
    let query = supabase
      .from("demands")
      .select(`
        *,
        clients:client_id (name),
        users:responsible_id (name)
      `)
      .order("created_at", { ascending: false })

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

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    if (filters?.responsible_id) {
      query = query.eq("responsible_id", filters.responsible_id)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching demands:", error)
      return []
    }

    return (data || []).map((item: any) => ({
      ...item,
      client_name: item.clients?.name || null,
      responsible_name: item.users?.name || null,
    })) as Demand[]
  } catch (error) {
    console.error("[v0] Error fetching demands:", error)
    return []
  }
}

export async function getDemandById(id: string): Promise<Demand | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("demands")
      .select(`
        *,
        clients:client_id (name),
        users:responsible_id (name)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("[v0] Error fetching demand:", error)
      return null
    }

    return {
      ...data,
      client_name: data.clients?.name || null,
      responsible_name: data.users?.name || null,
    } as Demand
  } catch (error) {
    console.error("[v0] Error fetching demand:", error)
    return null
  }
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
      .select(`
        *,
        clients:client_id (name),
        users:responsible_id (name)
      `)
      .single()

    if (error) {
      console.error("[v0] Error creating demand:", error)
      throw new Error(error.message)
    }

    await sendWebhookNotification('demand.created', result)

    return {
      ...result,
      client_name: result.clients?.name || null,
      responsible_name: result.users?.name || null,
    } as Demand
  } catch (error) {
    console.error("[v0] Error creating demand:", error)
    throw error
  }
}

export async function updateDemand(id: string, data: Partial<Demand>): Promise<Demand | null> {
  try {
    const supabase = await createClient()
    
    const updateData: any = {}
    const fields: (keyof Demand)[] = ['name', 'description', 'area', 'responsible_id', 'deadline', 'status', 'priority']

    for (const field of fields) {
      if (field in data) {
        updateData[field] = data[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return await getDemandById(id)
    }

    const { data: result, error } = await supabase
      .from("demands")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        clients:client_id (name),
        users:responsible_id (name)
      `)
      .single()

    if (error) {
      console.error("[v0] Error updating demand:", error)
      throw new Error(error.message)
    }

    await sendWebhookNotification('demand.updated', { id, ...result })

    return {
      ...result,
      client_name: result.clients?.name || null,
      responsible_name: result.users?.name || null,
    } as Demand
  } catch (error) {
    console.error("[v0] Error updating demand:", error)
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
      throw new Error(error.message)
    }

    await sendWebhookNotification('demand.deleted', { id })
  } catch (error) {
    console.error("[v0] Error deleting demand:", error)
    throw error
  }
}
