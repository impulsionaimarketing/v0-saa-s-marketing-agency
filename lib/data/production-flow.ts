"use server"

import { createClient } from "@/lib/supabase/server"
import { notifyDemandAssigned } from "@/lib/push"

// Fluxo: Cronograma → Produção (conteúdos) → Demandas (tarefas de trabalho)
// - Roteiros/briefings do cronograma viram CONTEÚDOS na Produção (não viram demanda).
// - Ao entrar numa etapa que exige trabalho (Captação, Edição), nasce uma tarefa
//   na aba Demandas para o responsável. O status da tarefa é independente da etapa.

type ContentKind = "video" | "arte"

const TABLE: Record<ContentKind, "video_scripts" | "arte_briefs"> = {
  video: "video_scripts",
  arte: "arte_briefs",
}

// Etapa → texto da tarefa criada automaticamente, por tipo de conteúdo
const STAGE_TASK: Record<"Vídeo" | "Arte", Record<string, string>> = {
  Vídeo: { Captação: "Gravar", Edição: "Editar" },
  Arte: { Captação: "Criar arte" },
}

// Envia um roteiro/briefing do cronograma para a Produção (etapa Planejamento)
export async function sendContentToProduction(kind: ContentKind, id: string, clientId: string): Promise<string | null> {
  const supabase = await createClient()
  const table = TABLE[kind]

  const { data: item, error } = await supabase.from(table).select("*").eq("id", id).single()
  if (error || !item) throw new Error("Item não encontrado")

  // Já enviado: não duplica
  if (item.production_id) return item.production_id as string

  const type = kind === "video" ? "Vídeo" : "Arte"
  const { data: created, error: rpcError } = await supabase.rpc("insert_production", {
    p_client_id: clientId,
    p_type: type,
    p_responsible_id: item.responsible_id || null,
    p_status: "Planejamento",
    p_post_date: item.deadline || null,
    p_notes: item.name || null,
  })

  const productionId: string | undefined = typeof created === "string" ? created : created?.id
  if (rpcError || !productionId) {
    console.error("[v0] Error creating production from", table, rpcError)
    throw new Error(rpcError?.message || "Não foi possível criar o conteúdo na Produção")
  }

  // Título do conteúdo (ex.: "Vídeo 3") e vínculo de volta no roteiro/briefing
  await supabase.from("productions").update({ title: item.name }).eq("id", productionId)

  const { error: linkError } = await supabase
    .from(table)
    .update({ production_id: productionId, is_converted_to_demand: true })
    .eq("id", id)
  if (linkError) console.error("[v0] Error linking", table, "to production:", linkError)

  return productionId
}

// Envia todos os roteiros e briefings de um mês para a Produção
export async function sendMonthToProduction(
  clientId: string,
  month: number,
  year: number
): Promise<{ videos: number; artes: number }> {
  const supabase = await createClient()
  const counts = { videos: 0, artes: 0 }

  for (const kind of ["video", "arte"] as const) {
    const { data: items } = await supabase
      .from(TABLE[kind])
      .select("id, production_id")
      .eq("client_id", clientId)
      .eq("month", month)
      .eq("year", year)
      .order("created_at", { ascending: true })

    for (const item of items || []) {
      if (item.production_id) continue
      await sendContentToProduction(kind, item.id, clientId)
      if (kind === "video") counts.videos++
      else counts.artes++
    }
  }

  return counts
}

// Cria a tarefa (demanda) da etapa em que o conteúdo entrou, se houver uma para ela
export async function ensureStageTask(productionId: string, newStatus: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { data: production } = await supabase
      .from("productions")
      .select("id, client_id, type, title, notes, responsible_id, post_date")
      .eq("id", productionId)
      .single()
    if (!production) return

    const type = production.type as "Vídeo" | "Arte"
    const verb = STAGE_TASK[type]?.[newStatus]
    if (!verb) return

    const contentName = production.title || production.notes || type
    const taskName = `${verb} ${contentName}`

    // Não duplica a tarefa se o conteúdo voltar para a mesma etapa
    const { data: existing } = await supabase
      .from("demands")
      .select("id")
      .eq("production_id", productionId)
      .eq("name", taskName)
      .limit(1)
    if (existing && existing.length > 0) return

    const { data: demand, error } = await supabase
      .from("demands")
      .insert({
        name: taskName,
        description: `Tarefa criada automaticamente: conteúdo "${contentName}" entrou em ${newStatus}.`,
        client_id: production.client_id,
        area: type,
        responsible_id: production.responsible_id || null,
        deadline: production.post_date || null,
        status: "A Fazer",
        priority: "medium",
      })
      .select("id")
      .single()

    if (error || !demand) {
      console.error("[v0] Error creating stage task:", error)
      return
    }

    // Vínculo tarefa → conteúdo (coluna criada pela migração production_flow.sql)
    const { error: linkError } = await supabase
      .from("demands")
      .update({ production_id: productionId })
      .eq("id", demand.id)
    if (linkError) console.error("[v0] Error linking task to production:", linkError)

    await notifyDemandAssigned({
      id: demand.id,
      name: taskName,
      client_id: production.client_id,
      responsible_id: production.responsible_id,
      deadline: production.post_date,
    })
  } catch (error) {
    console.error("[v0] Error ensuring stage task:", error)
  }
}
