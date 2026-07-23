"use server"

import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import { computeNextExecution, computeEndDate } from "@/lib/stories/schedule-utils"
import type {
  StorySchedule,
  CreateStoryScheduleInput,
  ScheduleConfigInput,
  ScheduleStatus,
} from "@/lib/types/stories"

// Mapeia uma linha (com joins) para StorySchedule
function mapRow(row: any): StorySchedule {
  return {
    ...row,
    content_type: row.story_contents?.type,
    content_thumbnail_url: row.story_contents?.thumbnail_url,
    content_file_url: row.story_contents?.file_url,
    content_name: row.story_contents?.name ?? row.story_contents?.caption ?? null,
    folder_id: row.story_contents?.folder_id ?? null,
    folder_name: row.story_contents?.story_folders?.name ?? null,
    company_name: row.clients?.name ?? null,
  } as StorySchedule
}

const SELECT_WITH_JOINS = `
  *,
  story_contents:content_id (
    type, thumbnail_url, file_url, name, caption, folder_id,
    story_folders:folder_id ( name )
  ),
  clients:company_id ( name )
`

export async function getStorySchedules(companyId: string): Promise<StorySchedule[]> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("story_schedules")
      .select(SELECT_WITH_JOINS)
      .eq("company_id", companyId)
      .order("next_execution", { ascending: true, nullsFirst: false })

    if (error) {
      console.error("[v0] Error fetching story schedules:", error)
      return []
    }
    return ((data as any[]) || []).map(mapRow)
  } catch (error) {
    console.error("[v0] Error fetching story schedules:", error)
    return []
  }
}

export async function getStoryScheduleById(id: string): Promise<StorySchedule | null> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("story_schedules")
      .select(SELECT_WITH_JOINS)
      .eq("id", id)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching story schedule:", error)
      return null
    }
    return data ? mapRow(data) : null
  } catch (error) {
    console.error("[v0] Error fetching story schedule:", error)
    return null
  }
}

// Cria (ou substitui) o agendamento ativo de uma mídia.
// Garante 1 ativo por mídia: cancela agendamentos ativos anteriores.
export async function createStorySchedule(
  input: CreateStoryScheduleInput,
): Promise<StorySchedule | null> {
  try {
    const supabase = await createSupabaseClient()

    // Remove agendamentos ativos anteriores desta mídia
    await supabase
      .from("story_schedules")
      .delete()
      .eq("content_id", input.content_id)
      .in("status", ["scheduled", "paused"])

    const config: ScheduleConfigInput = {
      frequency_type: input.frequency_type,
      interval_days: input.interval_days,
      weekdays: input.weekdays,
      execution_time: input.execution_time,
      start_date: input.start_date,
      total_weeks: input.total_weeks,
      execution_mode: input.execution_mode,
    }

    const nextExecution = computeNextExecution(config)
    const endDate = input.end_date ?? computeEndDate(input.start_date, input.total_weeks)

    const { data, error } = await supabase
      .from("story_schedules")
      .insert({
        company_id: input.company_id,
        content_id: input.content_id,
        frequency_type: input.frequency_type,
        interval_days: input.interval_days ?? 1,
        weekdays: input.weekdays ?? [],
        execution_time: input.execution_time,
        start_date: input.start_date,
        end_date: endDate,
        total_weeks: input.total_weeks ?? null,
        execution_mode: input.execution_mode,
        next_execution: nextExecution,
        status: "scheduled",
        enabled: true,
        created_by: input.created_by ?? null,
      })
      .select(SELECT_WITH_JOINS)
      .single()

    if (error) {
      console.error("[v0] Error creating story schedule:", error)
      throw new Error(error.message)
    }
    return mapRow(data)
  } catch (error) {
    console.error("[v0] Error creating story schedule:", error)
    throw error
  }
}

export async function updateStorySchedule(
  id: string,
  config: ScheduleConfigInput,
): Promise<StorySchedule | null> {
  try {
    const supabase = await createSupabaseClient()

    const nextExecution = computeNextExecution(config)
    const endDate = config.end_date ?? computeEndDate(config.start_date, config.total_weeks)

    const { data, error } = await supabase
      .from("story_schedules")
      .update({
        frequency_type: config.frequency_type,
        interval_days: config.interval_days ?? 1,
        weekdays: config.weekdays ?? [],
        execution_time: config.execution_time,
        start_date: config.start_date,
        end_date: endDate,
        total_weeks: config.total_weeks ?? null,
        execution_mode: config.execution_mode,
        next_execution: nextExecution,
        status: "scheduled",
      })
      .eq("id", id)
      .select(SELECT_WITH_JOINS)
      .single()

    if (error) {
      console.error("[v0] Error updating story schedule:", error)
      throw new Error(error.message)
    }
    return mapRow(data)
  } catch (error) {
    console.error("[v0] Error updating story schedule:", error)
    throw error
  }
}

export async function setStoryScheduleStatus(
  id: string,
  status: ScheduleStatus,
): Promise<StorySchedule | null> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("story_schedules")
      .update({ status, enabled: status === "scheduled" })
      .eq("id", id)
      .select(SELECT_WITH_JOINS)
      .single()

    if (error) {
      console.error("[v0] Error updating schedule status:", error)
      throw new Error(error.message)
    }
    return mapRow(data)
  } catch (error) {
    console.error("[v0] Error updating schedule status:", error)
    throw error
  }
}

// Duplica um agendamento existente (recalcula next_execution)
export async function duplicateStorySchedule(id: string): Promise<StorySchedule | null> {
  const original = await getStoryScheduleById(id)
  if (!original) throw new Error("Agendamento não encontrado")

  return createStorySchedule({
    company_id: original.company_id,
    content_id: original.content_id,
    frequency_type: original.frequency_type,
    interval_days: original.interval_days,
    weekdays: original.weekdays,
    execution_time: original.execution_time,
    start_date: original.start_date,
    total_weeks: original.total_weeks,
    end_date: original.end_date,
    execution_mode: original.execution_mode,
    created_by: original.created_by,
  })
}

export async function deleteStorySchedule(id: string): Promise<void> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("story_schedules")
      .delete()
      .eq("id", id)
      .select("id")
    if (error) {
      console.error("[v0] Error deleting story schedule:", error)
      throw new Error(error.message)
    }
    if (!data || data.length === 0) {
      throw new Error(
        "Nenhuma linha removida ao excluir o agendamento. Verifique as permissões (RLS/GRANT) de DELETE na tabela story_schedules.",
      )
    }
  } catch (error) {
    console.error("[v0] Error deleting story schedule:", error)
    throw error
  }
}
