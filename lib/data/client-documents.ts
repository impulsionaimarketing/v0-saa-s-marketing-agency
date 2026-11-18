"use server"

import { createClient } from "@/lib/supabase/server"
import { buildTemplateHtml, defaultDocumentTitle, type DocumentTemplate } from "@/lib/documents/templates"

export interface ClientDocument {
  id: string
  client_id: string
  month: number | null
  year: number | null
  title: string
  template: DocumentTemplate
  content: string
  created_at: string
  updated_at: string
}

export async function getClientDocuments(clientId: string, month?: number, year?: number): Promise<ClientDocument[]> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from("client_documents")
      .select("*")
      .eq("client_id", clientId)
      .order("updated_at", { ascending: false })
    if (month) query = query.eq("month", month)
    if (year) query = query.eq("year", year)
    const { data, error } = await query
    if (error) {
      console.error("[v0] Error fetching client documents:", error)
      return []
    }
    return (data || []) as ClientDocument[]
  } catch (error) {
    console.error("[v0] Error fetching client documents:", error)
    return []
  }
}

// Garante que existam os itens "Vídeo 1…N" / "Arte 1…N" do mês, para poderem
// ser enviados à Produção (sem duplicar os que já existem).
async function ensureMonthItems(
  clientId: string,
  template: "video" | "arte",
  quantity: number,
  month: number,
  year: number,
) {
  const supabase = await createClient()
  const table = template === "video" ? "video_scripts" : "arte_briefs"
  const prefix = template === "video" ? "Vídeo" : "Arte"

  const { data: existing } = await supabase
    .from(table)
    .select("name")
    .eq("client_id", clientId)
    .eq("month", month)
    .eq("year", year)
  const names = new Set((existing || []).map((r: { name: string }) => r.name))

  const missing = Array.from({ length: quantity }, (_, i) => `${prefix} ${i + 1}`)
    .filter((name) => !names.has(name))
    .map((name) => ({ client_id: clientId, name, month, year }))

  if (missing.length > 0) {
    const { error } = await supabase.from(table).insert(missing)
    if (error) console.error("[v0] Error creating month items:", error)
  }
}

export async function createClientDocument(data: {
  clientId: string
  clientName?: string
  template: DocumentTemplate
  month: number
  year: number
  quantity?: number
  title?: string
}): Promise<ClientDocument> {
  const supabase = await createClient()

  const content = buildTemplateHtml(data.template, {
    quantity: data.quantity,
    clientName: data.clientName,
    month: data.month,
    year: data.year,
  })

  const { data: result, error } = await supabase
    .from("client_documents")
    .insert({
      client_id: data.clientId,
      month: data.month,
      year: data.year,
      title: data.title?.trim() || defaultDocumentTitle(data.template, data.month, data.year),
      template: data.template,
      content,
    })
    .select("*")
    .single()

  if (error || !result) {
    console.error("[v0] Error creating client document:", error)
    throw new Error(error?.message || "Não foi possível criar o documento")
  }

  if (data.template === "video" || data.template === "arte") {
    await ensureMonthItems(data.clientId, data.template, Math.max(1, data.quantity || 1), data.month, data.year)
  }

  return result as ClientDocument
}

export async function updateClientDocument(
  id: string,
  data: { title?: string; content?: string },
): Promise<void> {
  const supabase = await createClient()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.title !== undefined) update.title = data.title
  if (data.content !== undefined) update.content = data.content

  const { error } = await supabase.from("client_documents").update(update).eq("id", id)
  if (error) {
    console.error("[v0] Error updating client document:", error)
    throw new Error(error.message)
  }
}

export async function deleteClientDocument(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("client_documents").delete().eq("id", id)
  if (error) {
    console.error("[v0] Error deleting client document:", error)
    throw new Error(error.message)
  }
}

// Quantidade de documentos por cliente (para mostrar nas pastas)
export async function getDocumentCountsByClient(): Promise<Record<string, number>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("client_documents").select("client_id")
    if (error) {
      console.error("[v0] Error counting client documents:", error)
      return {}
    }
    const counts: Record<string, number> = {}
    for (const row of data || []) counts[row.client_id] = (counts[row.client_id] || 0) + 1
    return counts
  } catch (error) {
    console.error("[v0] Error counting client documents:", error)
    return {}
  }
}
