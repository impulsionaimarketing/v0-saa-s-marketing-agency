"use server"

import { createClient } from "@/lib/supabase/server"

export interface DashboardStats {
  totalClients: number
  activeClients: number
  pendingDemands: number
  lateDemands: number
  totalAlerts: number
  unreadAlerts: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = await createClient()

    // Use RPC functions to bypass PostgREST cache
    const [clientsRes, demandsRes, alertsRes] = await Promise.all([
      supabase.rpc("get_all_clients"),
      supabase.rpc("get_all_demands"),
      supabase.rpc("get_all_alerts"),
    ])

    const clients = clientsRes.data || []
    const demands = demandsRes.data || []
    const alerts = alertsRes.data || []

    const today = new Date().toISOString().split("T")[0]

    return {
      totalClients: clients.length,
      activeClients: clients.filter((c: any) => c.contract_status === "Ativo").length,
      pendingDemands: demands.filter((d: any) => ["A Fazer", "Em Produção", "Em Revisão"].includes(d.status)).length,
      lateDemands: demands.filter(
        (d: any) =>
          d.status === "Atrasado" || (d.deadline && d.deadline < today && !["Publicado", "Aprovado"].includes(d.status))
      ).length,
      totalAlerts: alerts.length,
      unreadAlerts: alerts.filter((a: any) => !a.is_read).length,
    }
  } catch (error) {
    console.error("[v0] Error fetching dashboard stats:", error)
    return {
      totalClients: 0,
      activeClients: 0,
      pendingDemands: 0,
      lateDemands: 0,
      totalAlerts: 0,
      unreadAlerts: 0,
    }
  }
}

export async function getRecentActivity(limit = 10) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc("get_recent_activity", { p_limit: limit })

    if (error) {
      console.error("[v0] Error fetching recent activity:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[v0] Error fetching recent activity:", error)
    return []
  }
}
