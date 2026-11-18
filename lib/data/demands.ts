"use server"

import { createClient } from "@/lib/supabase/server"
import { sendWebhookNotification } from "@/lib/webhooks/send-notification"
import { notifyDemandAssigned } from "@/lib/push"

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

    // Use RPC to get demands with joined names (same as dashboard uses)
    const { data, error } = await supabase.rpc('get_all_demands')

    if (error) {
      console.error("[v0] Error fetching demands:", error)
      return []
    }

    let demands = (data as Demand[]) || []

    // Apply filters
    if (filters?.current_user_role === 'Colaborador' && filters?.current_user_id) {
      demands = demands.filter(d => d.responsible_id === filters.current_user_id)
    }

    if (filters?.client_id) {
      demands = demands.filter(d => d.client_id === filters.client_id)
    }

    if (filters?.area && filters.area !== "all") {
      demands = demands.filter(d => d.area === filters.area)
    }

    if (filters?.status) {
      demands = demands.filter(d => d.status === filters.status)
    }

    if (filters?.responsible_id) {
      demands = demands.filter(d => d.responsible_id === filters.responsible_id)
    }

    // Sort by deadline
    demands.sort((a, b) => {
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    })

    return demands
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
      .from('demands')
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

    // Demandas são só controle de trabalho do dia a dia: não criam produção.

    // Avisa o responsável no celular
    await notifyDemandAssigned(result as Demand)

    return result as Demand
  } catch (error) {
    console.error("[v0] Error creating demand:", error)
    throw error
  }
}

export async function updateDemand(id: string, data: Partial<Demand>): Promise<Demand | null> {
  try {
    const supabase = await createClient()

    // Responsável antes da edição, para avisar só quando mudar
    const { data: before } = await supabase.from('demands').select('responsible_id').eq('id', id).maybeSingle()

    const updateData: Record<string, unknown> = {}
    const fields: (keyof Demand)[] = ['name', 'description', 'client_id', 'area', 'responsible_id', 'deadline', 'status', 'priority']

    for (const field of fields) {
      if (field in data) {
        updateData[field] = data[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      const { data: existing } = await supabase
        .from('demands')
        .select('*')
        .eq('id', id)
        .single()
      return existing as Demand
    }

    updateData.updated_at = new Date().toISOString()

    const { data: result, error } = await supabase
      .from('demands')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !result) {
      console.error("[v0] Error updating demand:", error)
      throw new Error("Failed to update demand")
    }

    if (result.responsible_id && result.responsible_id !== before?.responsible_id) {
      await notifyDemandAssigned(result as Demand)
    }

    // Send webhook notification
    await sendWebhookNotification('demand.updated', { id, ...result })

    return result as Demand
  } catch (error) {
    console.error("[v0] Error updating demand:", error)
    throw error
  }
}


export async function updateDemandStatus(id: string, status: Demand["status"]): Promise<Demand | null> {
  try {
    const supabase = await createClient()

    const { data: result, error } = await supabase
      .from('demands')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !result) {
      console.error("[v0] Error updating demand status:", error)
      throw new Error("Failed to update demand status")
    }

    // Send webhook notification
    await sendWebhookNotification('demand.status_changed', { id, status, ...result })

    return result as Demand
  } catch (error) {
    console.error("[v0] Error updating demand status:", error)
    throw error
  }
}

export async function deleteDemand(id: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('demands')
      .delete()
      .eq('id', id)

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
