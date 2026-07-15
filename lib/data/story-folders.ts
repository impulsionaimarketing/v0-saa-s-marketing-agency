"use server"

import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import type { StoryFolder, CreateStoryFolderInput } from "@/lib/types/stories"

// =====================================================================
// PASTAS DE STORIES (estilo Google Drive)
// =====================================================================

export async function getStoryFolders(companyId: string): Promise<StoryFolder[]> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("story_folders")
      .select("*")
      .eq("company_id", companyId)
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching story folders:", error)
      return []
    }

    const folders = (data as StoryFolder[]) || []
    if (folders.length === 0) return []

    // Conta mídias por pasta
    const { data: counts, error: countError } = await supabase
      .from("story_contents")
      .select("folder_id")
      .eq("company_id", companyId)
      .not("folder_id", "is", null)

    if (countError) {
      console.error("[v0] Error counting folder contents:", countError)
      return folders
    }

    const countMap = new Map<string, number>()
    for (const row of (counts as { folder_id: string }[]) || []) {
      countMap.set(row.folder_id, (countMap.get(row.folder_id) ?? 0) + 1)
    }

    return folders.map((f) => ({ ...f, content_count: countMap.get(f.id) ?? 0 }))
  } catch (error) {
    console.error("[v0] Error fetching story folders:", error)
    return []
  }
}

export async function createStoryFolder(
  input: CreateStoryFolderInput,
): Promise<StoryFolder | null> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("story_folders")
      .insert({
        company_id: input.company_id,
        name: input.name,
        created_by: input.created_by ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating story folder:", error)
      throw new Error(error.message)
    }
    return data as StoryFolder
  } catch (error) {
    console.error("[v0] Error creating story folder:", error)
    throw error
  }
}

export async function renameStoryFolder(id: string, name: string): Promise<StoryFolder | null> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("story_folders")
      .update({ name })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error renaming story folder:", error)
      throw new Error(error.message)
    }
    return data as StoryFolder
  } catch (error) {
    console.error("[v0] Error renaming story folder:", error)
    throw error
  }
}

// Exclui a pasta. As mídias NUNCA são apagadas:
//   - moveTo definido: move as mídias para a pasta destino
//   - moveTo nulo: mídias ficam "Sem pasta" (folder_id = null via ON DELETE SET NULL)
export async function deleteStoryFolder(id: string, moveTo?: string | null): Promise<void> {
  try {
    const supabase = await createSupabaseClient()

    if (moveTo) {
      const { error: moveError } = await supabase
        .from("story_contents")
        .update({ folder_id: moveTo, updated_at: new Date().toISOString() })
        .eq("folder_id", id)
      if (moveError) {
        console.error("[v0] Error moving contents before folder delete:", moveError)
        throw new Error(moveError.message)
      }
    }

    const { error } = await supabase.from("story_folders").delete().eq("id", id)
    if (error) {
      console.error("[v0] Error deleting story folder:", error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error("[v0] Error deleting story folder:", error)
    throw error
  }
}
