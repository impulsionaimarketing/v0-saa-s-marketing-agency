"use server"

import { createClient } from "@/lib/supabase/server"

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
}): Promise<Demand[]> {
  try {
    const supabase = await createClient()

    // Use RPC function to bypass PostgREST cache
    const { data, error } = await supabase.rpc("get_all_demands")

    if (error) {
      console.error("[v0] Error fetching demands via RPC:", error)
      return []
    }

    let demands = data || []

    // Apply filters client-side
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

    return demand
  } catch (error) {
    console.error("[v0] Error updating demand:", error)
    throw error
  }
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
  } catch (error) {
    console.error("[v0] Error deleting demand:", error)
    throw error
  }
}
