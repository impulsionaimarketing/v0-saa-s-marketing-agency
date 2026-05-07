"use server"

import { query, queryOne, execute } from "@/lib/db"

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
    let sql = `SELECT a.*, c.name as client_name FROM alerts a LEFT JOIN clients c ON a.client_id = c.id`
    const params: unknown[] = []
    let paramCount = 1
    const conditions: string[] = []

    if (filters?.type && filters.type !== "all") {
      conditions.push(`a.type = $${paramCount}`)
      params.push(filters.type)
      paramCount++
    }

    if (filters?.severity && filters.severity !== "all") {
      conditions.push(`a.severity = $${paramCount}`)
      params.push(filters.severity)
      paramCount++
    }

    if (filters?.is_read !== undefined) {
      conditions.push(`a.is_read = $${paramCount}`)
      params.push(filters.is_read)
      paramCount++
    }

    if (filters?.is_resolved !== undefined) {
      conditions.push(`a.is_resolved = $${paramCount}`)
      params.push(filters.is_resolved)
      paramCount++
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`
    }

    sql += ` ORDER BY a.created_at DESC`

    if (filters?.limit) {
      sql += ` LIMIT $${paramCount}`
      params.push(filters.limit)
    }

    const alerts = await query<Alert>(sql, params)
    return alerts
  } catch (error) {
    console.error("[v0] Error fetching alerts:", error)
    return []
  }
}

export async function getUnreadAlertsCount(): Promise<number> {
  try {
    const result = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM alerts WHERE is_read = false`
    )
    return result?.count || 0
  } catch (error) {
    console.error("[v0] Error fetching unread alerts count:", error)
    return 0
  }
}

export async function markAlertAsRead(id: string): Promise<void> {
  try {
    await execute(
      `UPDATE alerts SET is_read = true WHERE id = $1`,
      [id]
    )
  } catch (error) {
    console.error("[v0] Error marking alert as read:", error)
    throw error
  }
}

export async function markAllAlertsAsRead(): Promise<void> {
  try {
    await execute(`UPDATE alerts SET is_read = true`)
  } catch (error) {
    console.error("[v0] Error marking all alerts as read:", error)
    throw error
  }
}

export async function resolveAlert(id: string): Promise<void> {
  try {
    await execute(
      `UPDATE alerts SET is_resolved = true WHERE id = $1`,
      [id]
    )
  } catch (error) {
    console.error("[v0] Error resolving alert:", error)
    throw error
  }
}

export async function createAlert(data: Partial<Alert>): Promise<Alert | null> {
  try {
    const result = await queryOne<Alert>(
      `INSERT INTO alerts (type, title, description, severity, client_id, related_entity_type, related_entity_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.type,
        data.title,
        data.description || null,
        data.severity || "medium",
        data.client_id || null,
        data.related_entity_type || null,
        data.related_entity_id || null,
      ]
    )

    if (!result) {
      throw new Error("Failed to create alert")
    }

    return result
  } catch (error) {
    console.error("[v0] Error creating alert:", error)
    throw error
  }
}

export async function deleteAlert(id: string): Promise<void> {
  try {
    await execute("DELETE FROM alerts WHERE id = $1", [id])
  } catch (error) {
    console.error("[v0] Error deleting alert:", error)
    throw error
  }
}
