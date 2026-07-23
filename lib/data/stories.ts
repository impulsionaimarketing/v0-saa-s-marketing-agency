"use server"

import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import type {
  StoryContent,
  StoryAutomation,
  StoryPublicationHistory,
  StorySummary,
  CreateStoryContentInput,
  UpdateStoryContentInput,
  UpsertStoryAutomationInput,
} from "@/lib/types/stories"

// =====================================================================
// CONTEÚDOS
// =====================================================================

export async function getStoryContents(companyId: string): Promise<StoryContent[]> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("story_contents")
      .select(`*, story_folders:folder_id ( name )`)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching story contents:", error)
      return []
    }

    const rows = (data as any[]) || []
    if (rows.length === 0) return []

    // Busca os agendamentos ativos das mídias e faz o merge
    const contentIds = rows.map((r) => r.id)
    const { data: schedules } = await supabase
      .from("story_schedules")
      .select("*")
      .in("content_id", contentIds)
      .in("status", ["scheduled", "paused"])

    const scheduleMap = new Map<string, any>()
    for (const s of (schedules as any[]) || []) {
      scheduleMap.set(s.content_id, s)
    }

    return rows.map((row) => ({
      ...row,
      folder_name: row.story_folders?.name ?? null,
      schedule: scheduleMap.get(row.id) ?? null,
    })) as StoryContent[]
  } catch (error) {
    console.error("[v0] Error fetching story contents:", error)
    return []
  }
}

export async function createStoryContent(
  input: CreateStoryContentInput,
): Promise<StoryContent | null> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("story_contents")
      .insert({
        company_id: input.company_id,
        type: input.type,
        source: input.source,
        file_url: input.file_url ?? null,
        thumbnail_url: input.thumbnail_url ?? null,
        caption: input.caption ?? null,
        name: input.name ?? null,
        folder_id: input.folder_id ?? null,
        instagram_media_id: input.instagram_media_id ?? null,
        instagram_permalink: input.instagram_permalink ?? null,
        created_by: input.created_by ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating story content:", error)
      throw new Error(error.message)
    }
    return data as StoryContent
  } catch (error) {
    console.error("[v0] Error creating story content:", error)
    throw error
  }
}

// Cria múltiplos conteúdos de uma vez (usado na importação do Instagram)
export async function createStoryContentsBulk(
  inputs: CreateStoryContentInput[],
): Promise<StoryContent[]> {
  if (inputs.length === 0) return []
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("story_contents")
      .insert(
        inputs.map((input) => ({
          company_id: input.company_id,
          type: input.type,
          source: input.source,
          file_url: input.file_url ?? null,
          thumbnail_url: input.thumbnail_url ?? null,
          caption: input.caption ?? null,
          name: input.name ?? null,
          folder_id: input.folder_id ?? null,
          instagram_media_id: input.instagram_media_id ?? null,
          instagram_permalink: input.instagram_permalink ?? null,
          created_by: input.created_by ?? null,
        })),
      )
      .select()

    if (error) {
      console.error("[v0] Error creating story contents bulk:", error)
      throw new Error(error.message)
    }
    return (data as StoryContent[]) || []
  } catch (error) {
    console.error("[v0] Error creating story contents bulk:", error)
    throw error
  }
}

export async function updateStoryContent(
  id: string,
  input: UpdateStoryContentInput,
): Promise<StoryContent | null> {
  try {
    const supabase = await createSupabaseClient()
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (input.type !== undefined) updateData.type = input.type
    if (input.caption !== undefined) updateData.caption = input.caption
    if (input.name !== undefined) updateData.name = input.name
    if (input.folder_id !== undefined) updateData.folder_id = input.folder_id
    if (input.is_active !== undefined) updateData.is_active = input.is_active

    const { data, error } = await supabase
      .from("story_contents")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating story content:", error)
      throw new Error(error.message)
    }
    return data as StoryContent
  } catch (error) {
    console.error("[v0] Error updating story content:", error)
    throw error
  }
}

export async function deleteStoryContent(id: string): Promise<void> {
  try {
    const supabase = await createSupabaseClient()
    // .select() retorna as linhas realmente removidas. Se vier vazio, o DELETE
    // não afetou nada (ex.: RLS sem policy de DELETE) — tratamos como erro real
    // em vez de um "falso sucesso".
    const { data, error } = await supabase
      .from("story_contents")
      .delete()
      .eq("id", id)
      .select("id")
    if (error) {
      console.error("[v0] Error deleting story content:", error)
      throw new Error(error.message)
    }
    if (!data || data.length === 0) {
      throw new Error(
        "Nenhuma linha removida ao excluir a mídia. Verifique as permissões (RLS/GRANT) de DELETE na tabela story_contents.",
      )
    }
  } catch (error) {
    console.error("[v0] Error deleting story content:", error)
    throw error
  }
}

// Move várias mídias para uma pasta (folderId = null => "Sem pasta")
export async function moveStoryContents(ids: string[], folderId: string | null): Promise<void> {
  if (ids.length === 0) return
  try {
    const supabase = await createSupabaseClient()
    const { error } = await supabase
      .from("story_contents")
      .update({ folder_id: folderId, updated_at: new Date().toISOString() })
      .in("id", ids)
    if (error) {
      console.error("[v0] Error moving story contents:", error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error("[v0] Error moving story contents:", error)
    throw error
  }
}

// Exclui várias mídias de uma vez (agendamentos caem via ON DELETE CASCADE)
export async function deleteStoryContents(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("story_contents")
      .delete()
      .in("id", ids)
      .select("id")
    if (error) {
      console.error("[v0] Error deleting story contents:", error)
      throw new Error(error.message)
    }
    if (!data || data.length === 0) {
      throw new Error(
        "Nenhuma linha removida ao excluir as mídias. Verifique as permissões (RLS/GRANT) de DELETE na tabela story_contents.",
      )
    }
  } catch (error) {
    console.error("[v0] Error deleting story contents:", error)
    throw error
  }
}

// =====================================================================
// AUTOMAÇÃO
// =====================================================================

// Lista todas as automações da empresa (uma por pasta), com o nome da pasta.
export async function listStoryAutomations(companyId: string): Promise<StoryAutomation[]> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("story_automations")
      .select(`*, story_folders:folder_id ( name )`)
      .eq("company_id", companyId)

    if (error) {
      console.error("[v0] Error listing story automations:", error)
      return []
    }

    return ((data as any[]) || []).map((row) => ({
      ...row,
      folder_name: row.story_folders?.name ?? null,
    })) as StoryAutomation[]
  } catch (error) {
    console.error("[v0] Error listing story automations:", error)
    return []
  }
}

// Obtém a automação de uma pasta específica da empresa.
export async function getStoryAutomation(
  companyId: string,
  folderId: string,
): Promise<StoryAutomation | null> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("story_automations")
      .select(`*, story_folders:folder_id ( name )`)
      .eq("company_id", companyId)
      .eq("folder_id", folderId)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching story automation:", error)
      return null
    }
    if (!data) return null
    const row = data as any
    return { ...row, folder_name: row.story_folders?.name ?? null } as StoryAutomation
  } catch (error) {
    console.error("[v0] Error fetching story automation:", error)
    return null
  }
}

// Detecta erro de "coluna não existe" (migração ainda não aplicada no banco).
function isMissingColumnError(error: any, column: string): boolean {
  if (!error) return false
  // 42703 = undefined_column | PGRST204 = coluna ausente no schema cache do PostgREST
  const code = String(error.code ?? "")
  const message = String(error.message ?? "").toLowerCase()
  return (
    code === "42703" ||
    code === "PGRST204" ||
    message.includes(column.toLowerCase())
  )
}

// Cria ou atualiza a automação de uma pasta (uma por pasta dentro da empresa).
// Faz busca -> update/insert explícito (sem depender de índice único / ON CONFLICT)
// e cai para um fallback sem `instagram_account_id` caso essa coluna ainda não
// exista no banco (migração evolve-story-automation-instagram-account.sql).
export async function upsertStoryAutomation(
  input: UpsertStoryAutomationInput,
): Promise<StoryAutomation | null> {
  try {
    const supabase = await createSupabaseClient()

    const buildPayload = (includeInstagram: boolean): Record<string, unknown> => {
      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }
      if (includeInstagram && input.instagram_account_id !== undefined)
        payload.instagram_account_id = input.instagram_account_id || null
      if (input.enabled !== undefined) payload.enabled = input.enabled
      if (input.publish_mode !== undefined) payload.publish_mode = input.publish_mode
      if (input.frequency_type !== undefined) payload.frequency_type = input.frequency_type
      if (input.frequency_value !== undefined) payload.frequency_value = input.frequency_value
      if (input.weekdays !== undefined) payload.weekdays = input.weekdays
      if (input.execution_time !== undefined) payload.execution_time = input.execution_time
      if (input.daily_limit !== undefined) payload.daily_limit = input.daily_limit
      return payload
    }

    // 1. Já existe automação para esta pasta?
    const { data: existing, error: findError } = await supabase
      .from("story_automations")
      .select("id")
      .eq("company_id", input.company_id)
      .eq("folder_id", input.folder_id)
      .maybeSingle()

    if (findError) {
      console.error("[v0] Error checking existing story automation:", findError)
      throw new Error(findError.message)
    }

    const runWrite = async (includeInstagram: boolean) => {
      if (existing?.id) {
        // UPDATE
        return supabase
          .from("story_automations")
          .update(buildPayload(includeInstagram))
          .eq("id", existing.id)
          .select()
          .single()
      }
      // INSERT
      return supabase
        .from("story_automations")
        .insert({
          company_id: input.company_id,
          folder_id: input.folder_id,
          ...buildPayload(includeInstagram),
        })
        .select()
        .single()
    }

    let { data, error } = await runWrite(true)

    // Fallback: coluna instagram_account_id ainda não existe no banco.
    if (error && isMissingColumnError(error, "instagram_account_id")) {
      console.error(
        "[v0] Coluna instagram_account_id ausente em story_automations; salvando sem ela. Rode scripts/evolve-story-automation-instagram-account.sql para habilitar a escolha de conta.",
      )
      ;({ data, error } = await runWrite(false))
    }

    if (error) {
      console.error("[v0] Error upserting story automation:", error)
      throw new Error(error.message)
    }
    if (!data) {
      throw new Error(
        "A automação não foi salva (nenhuma linha retornada). Verifique as permissões (RLS/GRANT) da tabela story_automations.",
      )
    }
    return data as StoryAutomation
  } catch (error) {
    console.error("[v0] Error upserting story automation:", error)
    throw error
  }
}

// Exclui a automação de uma pasta (ao desprogramar a pasta).
export async function deleteStoryAutomation(companyId: string, folderId: string): Promise<void> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("story_automations")
      .delete()
      .eq("company_id", companyId)
      .eq("folder_id", folderId)
      .select("id")
    if (error) {
      console.error("[v0] Error deleting story automation:", error)
      throw new Error(error.message)
    }
    if (!data || data.length === 0) {
      throw new Error(
        "Nenhuma linha removida ao excluir a automação. Verifique as permissões (RLS/GRANT) de DELETE na tabela story_automations.",
      )
    }
  } catch (error) {
    console.error("[v0] Error deleting story automation:", error)
    throw error
  }
}

// =====================================================================
// HISTÓRICO
// =====================================================================

export async function getStoryHistory(companyId: string): Promise<StoryPublicationHistory[]> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("story_publication_history")
      .select(
        `*, story_contents:content_id (type, source, thumbnail_url)`,
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      console.error("[v0] Error fetching story history:", error)
      return []
    }

    return ((data as any[]) || []).map((row) => ({
      ...row,
      content_type: row.story_contents?.type,
      content_source: row.story_contents?.source,
      content_thumbnail_url: row.story_contents?.thumbnail_url,
    })) as StoryPublicationHistory[]
  } catch (error) {
    console.error("[v0] Error fetching story history:", error)
    return []
  }
}

// =====================================================================
// RESUMO (Card de resumo da tela principal)
// =====================================================================

export async function getStorySummary(companyId: string): Promise<StorySummary> {
  try {
    const supabase = await createSupabaseClient()

    const [automations, contents, lastPub, nextPub] = await Promise.all([
      supabase.from("story_automations").select("enabled, next_execution").eq("company_id", companyId),
      supabase.from("story_contents").select("id, is_active").eq("company_id", companyId),
      supabase
        .from("story_publication_history")
        .select("published_at")
        .eq("company_id", companyId)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("story_publication_history")
        .select("scheduled_for")
        .eq("company_id", companyId)
        .eq("status", "scheduled")
        .order("scheduled_for", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ])

    const allContents = (contents.data as { id: string; is_active: boolean }[]) || []
    const allAutomations =
      (automations.data as { enabled: boolean; next_execution: string | null }[]) || []

    // Pega a próxima execução mais próxima entre todas as automações de pastas.
    const nextFromAutomations = allAutomations
      .map((a) => a.next_execution)
      .filter((v): v is string => Boolean(v))
      .sort()[0]

    return {
      enabled: allAutomations.some((a) => a.enabled),
      total_contents: allContents.length,
      active_contents: allContents.filter((c) => c.is_active).length,
      last_publication: (lastPub.data?.published_at as string) ?? null,
      next_publication:
        (nextPub.data?.scheduled_for as string) ?? nextFromAutomations ?? null,
    }
  } catch (error) {
    console.error("[v0] Error building story summary:", error)
    return {
      enabled: false,
      total_contents: 0,
      active_contents: 0,
      last_publication: null,
      next_publication: null,
    }
  }
}
