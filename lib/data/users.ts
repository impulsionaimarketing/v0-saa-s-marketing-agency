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

// Mock data para demonstração quando não há conexão com o banco
const mockUsers: User[] = [
  {
    id: "1",
    name: "Ana Silva",
    email: "ana.silva@impulsionai.com",
    role: "Admin",
    area: null,
    status: "Ativo",
    avatar_url: null,
    modules_access: ["dashboard", "clientes", "demandas", "financeiro", "relatorios", "alertas", "colaboradores"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: "2",
    name: "Carlos Mendes",
    email: "carlos.mendes@impulsionai.com",
    role: "Gestor",
    area: "Tráfego",
    status: "Ativo",
    avatar_url: null,
    modules_access: ["dashboard", "clientes", "demandas", "relatorios"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 300).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "3",
    name: "Marina Costa",
    email: "marina.costa@impulsionai.com",
    role: "Colaborador",
    area: "Arte",
    status: "Ativo",
    avatar_url: null,
    modules_access: ["dashboard", "demandas"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: "4",
    name: "Pedro Santos",
    email: "pedro.santos@impulsionai.com",
    role: "Colaborador",
    area: "Vídeo",
    status: "Ativo",
    avatar_url: null,
    modules_access: ["dashboard", "demandas"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 150).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "5",
    name: "Julia Oliveira",
    email: "julia.oliveira@impulsionai.com",
    role: "Colaborador",
    area: "Comunicação",
    status: "Ativo",
    avatar_url: null,
    modules_access: ["dashboard", "demandas", "clientes"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "6",
    name: "Ricardo Lima",
    email: "ricardo.lima@impulsionai.com",
    role: "Gestor",
    area: "Arte",
    status: "Inativo",
    avatar_url: null,
    modules_access: ["dashboard", "clientes", "demandas"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
]

export async function getUsers(filters?: {
  role?: string
  area?: string
  status?: string
  search?: string
}): Promise<User[]> {
  // Verificar se DATABASE_URL está configurada
  if (!process.env.DATABASE_URL) {
    console.log("[v0] DATABASE_URL not configured, using mock data for users")
    return filterMockUsers(mockUsers, filters)
  }

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
    return users.length > 0 ? users : filterMockUsers(mockUsers, filters)
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    return filterMockUsers(mockUsers, filters)
  }
}

function filterMockUsers(users: User[], filters?: {
  role?: string
  area?: string
  status?: string
  search?: string
}): User[] {
  let result = [...users]

  if (filters?.role && filters.role !== "all") {
    result = result.filter(u => u.role === filters.role)
  }

  if (filters?.area && filters.area !== "all") {
    result = result.filter(u => u.area === filters.area)
  }

  if (filters?.status && filters.status !== "all") {
    result = result.filter(u => u.status === filters.status)
  }

  if (filters?.search) {
    const search = filters.search.toLowerCase()
    result = result.filter(u => 
      u.name.toLowerCase().includes(search) || 
      u.email.toLowerCase().includes(search)
    )
  }

  result.sort((a, b) => a.name.localeCompare(b.name))

  return result
}

export async function getUserById(id: string): Promise<User | null> {
  if (!process.env.DATABASE_URL) {
    return mockUsers.find(u => u.id === id) || null
  }

  try {
    const user = await queryOne<User>(
      "SELECT * FROM users WHERE id = $1",
      [id]
    )
    return user || mockUsers.find(u => u.id === id) || null
  } catch (error) {
    console.error("[v0] Error fetching user by id:", error)
    return mockUsers.find(u => u.id === id) || null
  }
}

export async function getUsersByArea(area: string): Promise<User[]> {
  const mockResult = mockUsers.filter(u => u.area === area && u.status === "Ativo")
  
  if (!process.env.DATABASE_URL) {
    return mockResult
  }

  try {
    const users = await query<User>(
      `SELECT * FROM users WHERE area = $1 AND status = 'Ativo' ORDER BY name`,
      [area]
    )
    return users.length > 0 ? users : mockResult
  } catch (error) {
    console.error("[v0] Error fetching users by area:", error)
    return mockResult
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
