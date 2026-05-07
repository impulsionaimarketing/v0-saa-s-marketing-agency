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
    const supabase = await createClient()
    let query = supabase.from("users").select("*")

    if (filters?.role && filters.role !== "all") {
      query = query.eq("role", filters.role)
    }

    if (filters?.area && filters.area !== "all") {
      query = query.eq("area", filters.area)
    }

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    query = query.order("name", { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching users:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    return []
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("[v0] Error fetching user by id:", error)
      return null
    }

    return data || null
  } catch (error) {
    console.error("[v0] Error fetching user by id:", error)
    return null
  }
}

export async function getUsersByArea(area: string): Promise<User[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("area", area)
      .eq("status", "Ativo")
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching users by area:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[v0] Error fetching users by area:", error)
    return []
  }
}

export async function createUser(data: Partial<User>): Promise<User | null> {
  try {
    const supabase = await createClient()
    const { data: result, error } = await supabase
      .from("users")
      .insert({
        name: data.name,
        email: data.email,
        role: data.role,
        area: data.area || null,
        status: data.status || "Ativo",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating user:", error)
      throw error
    }

    return result || null
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    throw error
  }
}

export async function updateUser(id: string, data: Partial<User>): Promise<User | null> {
  try {
    const supabase = await createClient()

    const fields: (keyof User)[] = ['name', 'email', 'role', 'area', 'status', 'avatar_url']
    const updateData: Record<string, unknown> = {}

    for (const field of fields) {
      if (field in data) {
        updateData[field] = data[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error
      return userData || null
    }

    const { data: result, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return result || null
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    throw error
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
    throw error
  }
}
