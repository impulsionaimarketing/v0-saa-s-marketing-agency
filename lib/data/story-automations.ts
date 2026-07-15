"use server"

import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import type {
  StoryPendingPublication,
  StoryPendingItem,
  StoryConfirmPayload,
  StoryAutomationHealth,
} from "@/lib/types/stories"

// =====================================================================
// Integração n8n — toda a regra de negócio vive nas views/funções SQL.
// Estas funções apenas leem as views e chamam a função de confirmação.
// Usam exatamente o mesmo createClient() de @/lib/supabase/server que os
// demais módulos do sistema (Produções, Clientes, Financeiro, etc.).
// =====================================================================

/**
 * Retorna os conteúdos aptos a publicar agora (next_execution <= now()).
 * Lê a view vw_story_pending_publications já filtrada e ranqueada no banco.
 */
export async function getPendingPublications(): Promise<StoryPendingItem[]> {
  const supabase = await createSupabaseClient()
  const { data, error } = await supabase
    .from("vw_story_pending_publications")
    .select("*")

  if (error) {
    console.error("[v0] Error fetching pending publications:", error)
    throw new Error(error.message)
  }

  return ((data as StoryPendingPublication[]) || []).map((row) => ({
    automation_id: row.automation_id,
    company_id: row.company_id,
    content_id: row.content_id,
    content_url: row.content_url,
    instagram_account_id: row.instagram_account_id,
    type: row.content_type,
    publish_mode: row.publish_mode,
  }))
}

/**
 * Confirma o resultado de uma publicação executada pelo n8n.
 * Delega para a função SQL story_confirm_publication, que atualiza
 * histórico, próxima execução e estado da sequência de forma atômica.
 */
export async function confirmPublication(payload: StoryConfirmPayload) {
  const supabase = await createSupabaseClient()
  const { data, error } = await supabase.rpc("story_confirm_publication", {
    p_automation_id: payload.automation_id,
    p_content_id: payload.content_id,
    p_status: payload.status,
    p_instagram_story_id: payload.instagram_story_id ?? null,
    p_error_message: payload.error_message ?? null,
  })

  if (error) {
    console.error("[v0] Error confirming publication:", error)
    throw new Error(error.message)
  }

  return data
}

/**
 * Métricas de saúde da automação para o dashboard.
 */
export async function getAutomationHealth(): Promise<StoryAutomationHealth> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("vw_story_automation_health")
      .select("*")
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching automation health:", error)
      return { active_automations: 0, published_today: 0, failed_today: 0, upcoming_24h: 0 }
    }

    return {
      active_automations: data?.active_automations ?? 0,
      published_today: data?.published_today ?? 0,
      failed_today: data?.failed_today ?? 0,
      upcoming_24h: data?.upcoming_24h ?? 0,
    }
  } catch (error) {
    console.error("[v0] Error fetching automation health:", error)
    return { active_automations: 0, published_today: 0, failed_today: 0, upcoming_24h: 0 }
  }
}
