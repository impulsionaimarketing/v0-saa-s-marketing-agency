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

// Mock data para demonstração quando não há conexão com o banco
const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "late_task",
    title: "Tarefa atrasada: Campanha Black Friday",
    description: "A entrega da arte para a campanha está 2 dias atrasada",
    severity: "high",
    client_id: "1",
    client_name: "TechCorp Brasil",
    related_entity_type: "task",
    related_entity_id: "task-1",
    is_read: false,
    is_resolved: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "2",
    type: "no_balance",
    title: "Saldo baixo: Campanha Google Ads",
    description: "O saldo da campanha está abaixo de R$ 100,00",
    severity: "medium",
    client_id: "2",
    client_name: "Loja Virtual ABC",
    related_entity_type: "campaign",
    related_entity_id: "campaign-1",
    is_read: false,
    is_resolved: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "3",
    type: "kpi_issue",
    title: "KPI abaixo da meta: CTR",
    description: "O CTR da campanha caiu 15% na última semana",
    severity: "medium",
    client_id: "3",
    client_name: "Restaurante Sabor & Arte",
    related_entity_type: "kpi",
    related_entity_id: "kpi-1",
    is_read: true,
    is_resolved: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "4",
    type: "pending_report",
    title: "Relatório pendente: Mensal de Março",
    description: "O relatório mensal precisa ser enviado ao cliente",
    severity: "low",
    client_id: "1",
    client_name: "TechCorp Brasil",
    related_entity_type: "report",
    related_entity_id: "report-1",
    is_read: true,
    is_resolved: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "5",
    type: "blocked_account",
    title: "Conta bloqueada: Meta Ads",
    description: "A conta de anúncios foi bloqueada por violação de política",
    severity: "high",
    client_id: "4",
    client_name: "Imobiliária Premium",
    related_entity_type: "account",
    related_entity_id: "account-1",
    is_read: false,
    is_resolved: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
]

export async function getAlerts(filters?: {
  type?: string
  severity?: string
  is_read?: boolean
  is_resolved?: boolean
  limit?: number
}): Promise<Alert[]> {
  // Verificar se DATABASE_URL está configurada
  if (!process.env.DATABASE_URL) {
    console.log("[v0] DATABASE_URL not configured, using mock data for alerts")
    return filterMockAlerts(mockAlerts, filters)
  }

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
    return alerts.length > 0 ? alerts : filterMockAlerts(mockAlerts, filters)
  } catch (error) {
    console.error("[v0] Error fetching alerts:", error)
    return filterMockAlerts(mockAlerts, filters)
  }
}

function filterMockAlerts(alerts: Alert[], filters?: {
  type?: string
  severity?: string
  is_read?: boolean
  is_resolved?: boolean
  limit?: number
}): Alert[] {
  let result = [...alerts]

  if (filters?.type && filters.type !== "all") {
    result = result.filter(a => a.type === filters.type)
  }

  if (filters?.severity && filters.severity !== "all") {
    result = result.filter(a => a.severity === filters.severity)
  }

  if (filters?.is_read !== undefined) {
    result = result.filter(a => a.is_read === filters.is_read)
  }

  if (filters?.is_resolved !== undefined) {
    result = result.filter(a => a.is_resolved === filters.is_resolved)
  }

  result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (filters?.limit) {
    result = result.slice(0, filters.limit)
  }

  return result
}

export async function getUnreadAlertsCount(): Promise<number> {
  if (!process.env.DATABASE_URL) {
    return mockAlerts.filter(a => !a.is_read).length
  }

  try {
    const result = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM alerts WHERE is_read = false`
    )
    return result?.count || mockAlerts.filter(a => !a.is_read).length
  } catch (error) {
    console.error("[v0] Error fetching unread alerts count:", error)
    return mockAlerts.filter(a => !a.is_read).length
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
