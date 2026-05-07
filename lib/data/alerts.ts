"use server"

import { createClient } from "@/lib/supabase/server"

export interface Alert {
  id: string
  type: "late_task" | "no_balance" | "blocked_account" | "kpi_issue" | "pending_report"
  title: string
  description: string | null
  severity: "low" | "medium" | "high"
  client_id: string | null
  client_name?: string
  related_entity_type: string | null
  related_entity_id: string | null
  is_read: boolean
  is_resolved: boolean
  created_at: string
}

export async function getAlerts(filters?: {
  type?: string
  severity?: string
  is_read?: boolean
  is_resolved?: boolean
  limit?: number
}): Promise<Alert[]> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from("alerts")
      .select("*, clients(name)")

    if (filters?.type && filters.type !== "all") {
      query = query.eq("type", filters.type)
    }

    if (filters?.severity && filters.severity !== "all") {
      query = query.eq("severity", filters.severity)
    }

    if (filters?.is_read !== undefined) {
      query = query.eq("is_read", filters.is_read)
    }

    if (filters?.is_resolved !== undefined) {
      query = query.eq("is_resolved", filters.is_resolved)
    }

    query = query.order("created_at", { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching alerts:", error)
      return []
    }

    // Map to include client_name from the joined clients table
    const alerts = (data || []).map((alert: any) => ({
      ...alert,
      client_name: alert.clients?.name || undefined,
    }))

    return alerts
  } catch (error) {
    console.error("[v0] Error fetching alerts:", error)
    return []
  }
}

export async function getUnreadAlertsCount(): Promise<number> {
  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false)

    if (error) {
      console.error("[v0] Error fetching unread alerts count:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("[v0] Error fetching unread alerts count:", error)
    return 0
  }
}

export async function markAlertAsRead(id: string): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("alerts")
      .update({ is_read: true })
      .eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("[v0] Error marking alert as read:", error)
    throw error
  }
}

export async function markAllAlertsAsRead(): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("alerts")
      .update({ is_read: true })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("[v0] Error marking all alerts as read:", error)
    throw error
  }
}

export async function resolveAlert(id: string): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("alerts")
      .update({ is_resolved: true })
      .eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("[v0] Error resolving alert:", error)
    throw error
  }
}

export async function createAlert(data: Partial<Alert>): Promise<Alert | null> {
  try {
    const supabase = await createClient()
    const { data: result, error } = await supabase
      .from("alerts")
      .insert({
        type: data.type,
        title: data.title,
        description: data.description || null,
        severity: data.severity || "medium",
        client_id: data.client_id || null,
        related_entity_type: data.related_entity_type || null,
        related_entity_id: data.related_entity_id || null,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return result || null
  } catch (error) {
    console.error("[v0] Error creating alert:", error)
    throw error
  }
}

export async function deleteAlert(id: string): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("alerts")
      .delete()
      .eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("[v0] Error deleting alert:", error)
    throw error
  }
}
