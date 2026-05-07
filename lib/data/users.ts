"use server"

import { query, queryOne, execute } from "@/lib/db"

export interface User {
  id: string
  name: string
  email: string
  role: "Admin" | "Gestor" | "Colaborador"
  area: "Arte" | "Vídeo" | "Tráfego" | "Comunicação" | null
  status: "Ativo" | "Inativo"
  avatar_url: string | null
  modules_access?: string[]
  created_at: string
  updated_at: string
}

export async function getUsers(filters?: {
  role?: string
  area?: string
  status?: string
  search?: string
}): Promise<User[]> {
  try {
    let sql = "SELECT * FROM users ORDER BY name"
    const params: unknown[] = []
    let paramCount = 1

    const conditions: string[] = []

    if (filters?.role && filters.role !== "all") {
      conditions.push(`role = $${paramCount}`)
      params.push(filters.role)
      paramCount++
    }

    if (filters?.area && filters.area !== "all") {
      conditions.push(`area = $${paramCount}`)
      params.push(filters.area)
      paramCount++
    }

    if (filters?.status && filters.status !== "all") {
      conditions.push(`status = $${paramCount}`)
      params.push(filters.status)
      paramCount++
    }

    if (filters?.search) {
      conditions.push(`(LOWER(name) LIKE LOWER($${paramCount}) OR LOWER(email) LIKE LOWER($${paramCount}))`)
      params.push(`%${filters.search}%`)
      params.push(`%${filters.search}%`)
      paramCount++
    }

    if (conditions.length > 0) {
      sql = `SELECT * FROM users WHERE ${conditions.join(" AND ")} ORDER BY name`
    }

    const users = await query<User>(sql, params)
    return users
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    return []
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const user = await queryOne<User>(
      "SELECT * FROM users WHERE id = $1",
      [id]
    )
    return user || null
  } catch (error) {
    console.error("[v0] Error fetching user by id:", error)
    return null
  }
}

export async function getUsersByArea(area: string): Promise<User[]> {
  try {
    const users = await query<User>(
      `SELECT * FROM users WHERE area = $1 AND status = 'Ativo' ORDER BY name`,
      [area]
    )
    return users
  } catch (error) {
    console.error("[v0] Error fetching users by area:", error)
    return []
  }
}

export async function createUser(data: Partial<User>): Promise<User | null> {
  try {
    const result = await queryOne<User>(
      `INSERT INTO users (name, email, role, area, status) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        data.name,
        data.email,
        data.role,
        data.area || null,
        data.status || "Ativo",
      ]
    )

    if (!result) {
      throw new Error("Failed to create user")
    }

    return result
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    throw error
  }
}

export async function updateUser(id: string, data: Partial<User>): Promise<User | null> {
  try {
    const updates: string[] = []
    const params: unknown[] = []
    let paramCount = 1

    const fields: (keyof User)[] = ['name', 'email', 'role', 'area', 'status', 'avatar_url']

    for (const field of fields) {
      if (field in data) {
        updates.push(`${field} = $${paramCount}`)
        params.push(data[field])
        paramCount++
      }
    }

    if (updates.length === 0) {
      return await queryOne<User>("SELECT * FROM users WHERE id = $1", [id])
    }

    updates.push(`updated_at = NOW()`)
    params.push(id)

    const result = await queryOne<User>(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      params
    )

    if (!result) {
      throw new Error("Failed to update user")
    }

    return result
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    throw error
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await execute("DELETE FROM users WHERE id = $1", [id])
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
    throw error
  }
}
