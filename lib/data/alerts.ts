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

    // Use RPC function to bypass PostgREST cache
    const { data, error } = await supabase.rpc("get_all_alerts")

    if (error) {
      console.error("[v0] Error fetching alerts via RPC:", error)
      return []
    }

    let alerts = data || []

    // Apply filters client-side
    if (filters?.type && filters.type !== "all") {
      alerts = alerts.filter((a: Alert) => a.type === filters.type)
    }

    if (filters?.severity && filters.severity !== "all") {
      alerts = alerts.filter((a: Alert) => a.severity === filters.severity)
    }

    if (filters?.is_read !== undefined) {
      alerts = alerts.filter((a: Alert) => a.is_read === filters.is_read)
    }

    if (filters?.is_resolved !== undefined) {
      alerts = alerts.filter((a: Alert) => a.is_resolved === filters.is_resolved)
    }

    if (filters?.limit) {
      alerts = alerts.slice(0, filters.limit)
    }

    return alerts
  } catch (error) {
    console.error("[v0] Error fetching alerts:", error)
    return []
  }
}

export async function getUnreadAlertsCount(): Promise<number> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc("get_all_alerts")

    if (error) {
      console.error("[v0] Error fetching unread alerts count:", error)
      return 0
    }

    return (data || []).filter((a: Alert) => !a.is_read).length
  } catch (error) {
    console.error("[v0] Error fetching unread alerts count:", error)
    return 0
  }
}

export async function markAlertAsRead(id: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.rpc("mark_alert_read", { p_id: id })

    if (error) {
      console.error("[v0] Error marking alert as read:", error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error("[v0] Error marking alert as read:", error)
    throw error
  }
}

export async function markAllAlertsAsRead(): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.rpc("mark_all_alerts_read")

    if (error) {
      console.error("[v0] Error marking all alerts as read:", error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error("[v0] Error marking all alerts as read:", error)
    throw error
  }
}

export async function resolveAlert(id: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.rpc("resolve_alert", { p_id: id })

    if (error) {
      console.error("[v0] Error resolving alert:", error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error("[v0] Error resolving alert:", error)
    throw error
  }
}

export async function createAlert(data: Partial<Alert>): Promise<Alert | null> {
  try {
    const supabase = await createClient()

    const { data: alert, error } = await supabase.rpc("insert_alert", {
      p_type: data.type,
      p_title: data.title,
      p_description: data.description,
      p_severity: data.severity || "medium",
      p_client_id: data.client_id,
      p_related_entity_type: data.related_entity_type,
      p_related_entity_id: data.related_entity_id,
    })

    if (error) {
      console.error("[v0] Error creating alert:", error)
      throw new Error(error.message)
    }

    return alert
  } catch (error) {
    console.error("[v0] Error creating alert:", error)
    throw error
  }
}

export async function deleteAlert(id: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.rpc("delete_alert", { p_id: id })

    if (error) {
      console.error("[v0] Error deleting alert:", error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error("[v0] Error deleting alert:", error)
    throw error
  }
}
