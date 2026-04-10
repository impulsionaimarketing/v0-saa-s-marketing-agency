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

    // First try RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_all_demands")

    let demands: Demand[] = []

    if (rpcError || !rpcData) {
      console.error("[v0] Error fetching demands via RPC, falling back to direct query:", rpcError)
      
      // Fallback: direct query with joins
      const { data: directData, error: directError } = await supabase
        .from('demands')
        .select(`
          id,
          name,
          description,
          client_id,
          area,
          responsible_id,
          deadline,
          status,
          priority,
          created_at,
          updated_at,
          clients!demands_client_id_fkey(name),
          users!demands_responsible_id_fkey(name)
        `)
        .order('deadline', { ascending: true, nullsFirst: false })

      if (directError) {
        console.error("[v0] Error fetching demands directly:", directError)
        return []
      }

      // Transform the data to include client_name and responsible_name
      demands = (directData || []).map((d: Record<string, unknown>) => ({
        id: d.id as string,
        name: d.name as string,
        description: d.description as string | null,
        client_id: d.client_id as string,
        client_name: (d.clients as { name: string } | null)?.name || 'Sem cliente',
        area: d.area as Demand['area'],
        responsible_id: d.responsible_id as string | null,
        responsible_name: (d.users as { name: string } | null)?.name || null,
        deadline: d.deadline as string | null,
        status: d.status as Demand['status'],
        priority: d.priority as Demand['priority'],
        created_at: d.created_at as string,
        updated_at: d.updated_at as string,
      }))
    } else {
      demands = rpcData || []
    }

    // Filter by user role: Colaboradores only see their own tasks
    if (filters?.current_user_role === 'Colaborador' && filters?.current_user_id) {
      console.log('[v0] Filtering demands for Colaborador:', filters.current_user_id)
      demands = demands.filter((d: Demand) => d.responsible_id === filters.current_user_id)
    }

    // Apply other filters client-side
    if (filters?.client_id) {
      demands = demands.filter((d: Demand) => d.client_id === filters.client_id)
    }

    if (filters?.area && filters.area !== "all") {
      demands = demands.filter((d: Demand) => d.area === filters.area)
    }

    if (filters?.status) {
      demands = demands.filter((d: Demand) => d.status === filters.status)
    }

    if (filters?.responsible_id) {
      demands = demands.filter((d: Demand) => d.responsible_id === filters.responsible_id)
    }

    // Sort by deadline
    demands.sort((a: Demand, b: Demand) => {
      if (!a.deadline && !b.deadline) return 0
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return a.deadline.localeCompare(b.deadline)
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

    const { data: demand, error } = await supabase.rpc("insert_demand", {
      p_name: data.name,
      p_description: data.description,
      p_client_id: data.client_id,
      p_area: data.area,
      p_responsible_id: data.responsible_id,
      p_deadline: data.deadline,
      p_status: data.status || "A Fazer",
      p_priority: data.priority || "medium",
    })

    if (error) {
      console.error("[v0] Error creating demand:", error)
      throw new Error(error.message)
    }

    // Send webhook notification
    await sendWebhookNotification('demand.created', demand)

    return demand
  } catch (error) {
    console.error("[v0] Error creating demand:", error)
    throw error
  }
}

export async function updateDemand(id: string, data: Partial<Demand>): Promise<Demand | null> {
  try {
    const supabase = await createClient()

    const { data: demand, error } = await supabase.rpc("update_demand", {
      p_id: id,
      p_name: data.name,
      p_description: data.description,
      p_client_id: data.client_id,
      p_area: data.area,
      p_responsible_id: data.responsible_id,
      p_deadline: data.deadline,
      p_status: data.status,
      p_priority: data.priority,
    })

    if (error) {
      console.error("[v0] Error updating demand:", error)
      throw new Error(error.message)
    }

    // Check if there's a production linked to this demand
    const { data: linkedProduction } = await supabase
      .from('productions')
      .select('id')
      .eq('demand_id', id)
      .single()

    // If there's a linked production, sync the changes
    if (linkedProduction) {
      console.log('[v0] Syncing demand changes to linked production:', linkedProduction.id)
      await supabase
        .from('productions')
        .update({
          responsible_id: data.responsible_id,
          status: mapDemandStatusToProductionStatus(data.status),
          post_date: data.deadline,
          updated_at: new Date().toISOString()
        })
        .eq('id', linkedProduction.id)
    }

    // Send webhook notification
    await sendWebhookNotification('demand.updated', { id, ...demand })

    return demand
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

    const { data: demand, error } = await supabase.rpc("update_demand_status", {
      p_id: id,
      p_status: status,
    })

    if (error) {
      console.error("[v0] Error updating demand status:", error)
      throw new Error(error.message)
    }

    // Send webhook notification
    await sendWebhookNotification('demand.status_changed', { id, status, ...demand })

    return demand
  } catch (error) {
    console.error("[v0] Error updating demand status:", error)
    throw error
  }
}

export async function deleteDemand(id: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.rpc("delete_demand_by_id", { p_id: id })

    if (error) {
      console.error("[v0] Error deleting demand:", error)
      throw new Error(error.message)
    }

    // Send webhook notification
    await sendWebhookNotification('demand.deleted', { id })
  } catch (error) {
    console.error("[v0] Error deleting demand:", error)
    throw error
  }
}
