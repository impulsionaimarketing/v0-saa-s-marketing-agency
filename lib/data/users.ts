"use server"

import { createClient } from "@/lib/supabase/server"

export interface User {
  id: string
  name: string
  email: string
  role: "Admin" | "Gestor" | "Colaborador"
  area: "Arte" | "Vídeo" | "Tráfego" | "Comunicação" | null
  status: "Ativo" | "Inativo"
  avatar_url: string | null
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
    const supabase = await createClient()

    // Use RPC function to bypass PostgREST cache
    const { data, error } = await supabase.rpc("get_all_users")

    if (error) {
      console.error("[v0] Error fetching users via RPC:", error)
      return []
    }

    let users = data || []

    // Apply filters client-side
    if (filters?.role && filters.role !== "all") {
      users = users.filter((u: User) => u.role === filters.role)
    }

    if (filters?.area && filters.area !== "all") {
      users = users.filter((u: User) => u.area === filters.area)
    }

    if (filters?.status && filters.status !== "all") {
      users = users.filter((u: User) => u.status === filters.status)
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase()
      users = users.filter(
        (u: User) =>
          u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
      )
    }

    // Sort by name
    users.sort((a: User, b: User) => a.name.localeCompare(b.name))

    return users
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    return []
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const supabase = await createClient()

    const { data: users, error } = await supabase.rpc("get_all_users")

    if (error) {
      console.error("[v0] Error fetching user by id:", error)
      return null
    }

    return users?.find((u: User) => u.id === id) || null
  } catch (error) {
    console.error("[v0] Error fetching user by id:", error)
    return null
  }
}

export async function getUsersByArea(area: string): Promise<User[]> {
  try {
    const supabase = await createClient()

    const { data: users, error } = await supabase.rpc("get_all_users")

    if (error) {
      console.error("[v0] Error fetching users by area:", error)
      return []
    }

    return (users || [])
      .filter((u: User) => u.area === area && u.status === "Ativo")
      .sort((a: User, b: User) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error("[v0] Error fetching users by area:", error)
    return []
  }
}

export async function createUser(data: Partial<User>): Promise<User | null> {
  try {
    const supabase = await createClient()

    const { data: user, error } = await supabase.rpc("insert_user", {
      p_name: data.name,
      p_email: data.email,
      p_role: data.role,
      p_area: data.area,
      p_status: data.status || "Ativo",
    })

    if (error) {
      console.error("[v0] Error creating user:", error)
      throw new Error(error.message)
    }

    return user
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    throw error
  }
}

export async function updateUser(id: string, data: Partial<User>): Promise<User | null> {
  try {
    const supabase = await createClient()

    const { data: user, error } = await supabase.rpc("update_user", {
      p_id: id,
      p_name: data.name,
      p_email: data.email,
      p_role: data.role,
      p_area: data.area,
      p_status: data.status,
    })

    if (error) {
      console.error("[v0] Error updating user:", error)
      throw new Error(error.message)
    }

    return user
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    throw error
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.rpc("delete_user_by_id", { p_id: id })

    if (error) {
      console.error("[v0] Error deleting user:", error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
    throw error
  }
}
