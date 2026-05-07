"use server"

import { query, queryOne, execute } from "@/lib/db"
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
    let sql = `
      SELECT d.*, c.name as client_name, u.name as responsible_name
      FROM demands d
      LEFT JOIN clients c ON d.client_id = c.id
      LEFT JOIN users u ON d.responsible_id = u.id
    `
    const params: unknown[] = []
    let paramCount = 1
    const conditions: string[] = []

    // Filter by user role: Colaboradores only see their own tasks
    if (filters?.current_user_role === 'Colaborador' && filters?.current_user_id) {
      conditions.push(`d.responsible_id = $${paramCount}`)
      params.push(filters.current_user_id)
      paramCount++
    }

    if (filters?.client_id) {
      conditions.push(`d.client_id = $${paramCount}`)
      params.push(filters.client_id)
      paramCount++
    }

    if (filters?.area && filters.area !== "all") {
      conditions.push(`d.area = $${paramCount}`)
      params.push(filters.area)
      paramCount++
    }

    if (filters?.status) {
      conditions.push(`d.status = $${paramCount}`)
      params.push(filters.status)
      paramCount++
    }

    if (filters?.responsible_id) {
      conditions.push(`d.responsible_id = $${paramCount}`)
      params.push(filters.responsible_id)
      paramCount++
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`
    }

    sql += ` ORDER BY d.deadline ASC NULLS LAST`

    const demands = await query<Demand>(sql, params)
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
    const result = await queryOne<Demand>(
      `INSERT INTO demands (name, description, client_id, area, responsible_id, deadline, status, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.name,
        data.description || null,
        data.client_id,
        data.area,
        data.responsible_id || null,
        data.deadline || null,
        data.status || "A Fazer",
        data.priority || "medium",
      ]
    )

    if (!result) {
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
    const updates: string[] = []
    const params: unknown[] = []
    let paramCount = 1

    const fields: (keyof Demand)[] = ['name', 'description', 'client_id', 'area', 'responsible_id', 'deadline', 'status', 'priority']

    for (const field of fields) {
      if (field in data) {
        updates.push(`${field} = $${paramCount}`)
        params.push(data[field])
        paramCount++
      }
    }

    if (updates.length === 0) {
      return await queryOne<Demand>("SELECT * FROM demands WHERE id = $1", [id])
    }

    updates.push(`updated_at = NOW()`)
    params.push(id)

    const result = await queryOne<Demand>(
      `UPDATE demands SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      params
    )

    if (!result) {
      throw new Error("Failed to update demand")
    }

    // Check if there's a production linked to this demand
    const linkedProduction = await queryOne<{ id: string }>(
      "SELECT id FROM productions WHERE demand_id = $1",
      [id]
    )

    // If there's a linked production, sync the changes
    if (linkedProduction) {
      console.log('[v0] Syncing demand changes to linked production:', linkedProduction.id)
      await execute(
        `UPDATE productions SET responsible_id = $1, status = $2, post_date = $3, updated_at = NOW() WHERE id = $4`,
        [
          data.responsible_id,
          mapDemandStatusToProductionStatus(data.status),
          data.deadline,
          linkedProduction.id
        ]
      )
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
    const result = await queryOne<Demand>(
      `UPDATE demands SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    )

    if (!result) {
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
    await execute("DELETE FROM demands WHERE id = $1", [id])

    // Send webhook notification
    await sendWebhookNotification('demand.deleted', { id })
  } catch (error) {
    console.error("[v0] Error deleting demand:", error)
    throw error
  }
}
