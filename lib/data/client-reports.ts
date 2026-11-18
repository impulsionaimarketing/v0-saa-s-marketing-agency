"use server"

import { createClient } from "@/lib/supabase/server"

// Relatório de tráfego por cliente: resumo do período + comparativo com o período anterior.
// Os números são congelados (snapshot) na geração, para o relatório enviado não mudar depois.

export interface ReportTotals {
  spend: number
  impressions: number
  clicks: number
  reach: number
  results: number
  conversion_value: number
  ctr: number
  cpc: number
  cpm: number
  cost_per_result: number
  roas: number
}

export interface PlatformSummary {
  platform: "meta" | "google"
  current: ReportTotals
  previous: ReportTotals
}

export interface ReportSnapshot {
  client_name: string
  campaign_type: string | null       // Mensagem | Venda | Alcance
  result_label: string               // "conversas", "compras", "alcance"...
  period: { start: string; end: string }
  previous_period: { start: string; end: string }
  total: { current: ReportTotals; previous: ReportTotals }
  platforms: PlatformSummary[]
  generated_at: string
}

export interface ClientReport {
  id: string
  client_id: string
  client_name?: string
  title: string
  period_start: string
  period_end: string
  status: "rascunho" | "enviado" | "visualizado"
  token: string
  snapshot: ReportSnapshot
  created_at: string
  sent_at: string | null
  viewed_at: string | null
}

const DAY = 86400000

function toDate(value: string): Date {
  return new Date(value + "T00:00:00Z")
}
function fmt(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function emptyTotals(): ReportTotals {
  return {
    spend: 0, impressions: 0, clicks: 0, reach: 0, results: 0, conversion_value: 0,
    ctr: 0, cpc: 0, cpm: 0, cost_per_result: 0, roas: 0,
  }
}

function finishTotals(t: ReportTotals): ReportTotals {
  return {
    ...t,
    ctr: t.impressions > 0 ? (t.clicks / t.impressions) * 100 : 0,
    cpc: t.clicks > 0 ? t.spend / t.clicks : 0,
    cpm: t.impressions > 0 ? (t.spend / t.impressions) * 1000 : 0,
    cost_per_result: t.results > 0 ? t.spend / t.results : 0,
    roas: t.spend > 0 ? t.conversion_value / t.spend : 0,
  }
}

async function fetchRows(clientId: string, start: string, end: string) {
  const supabase = await createClient()
  const pageSize = 1000
  const all: any[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("ads_insights_daily")
      .select("platform, spend, impressions, clicks, reach, results, result_type, conversion_value")
      .eq("client_id", clientId)
      .gte("report_date", start)
      .lte("report_date", end)
      .range(from, from + pageSize - 1)
    if (error) throw new Error("Erro ao buscar dados de anúncios")
    all.push(...(data || []))
    if (!data || data.length < pageSize) break
  }
  return all
}

function summarize(rows: any[]) {
  const total = emptyTotals()
  const byPlatform: Record<string, ReportTotals> = {}
  for (const r of rows) {
    const p = (byPlatform[r.platform] ||= emptyTotals())
    for (const t of [total, p]) {
      t.spend += Number(r.spend) || 0
      t.impressions += Number(r.impressions) || 0
      t.clicks += Number(r.clicks) || 0
      t.reach += Number(r.reach) || 0
      t.results += Number(r.results) || 0
      t.conversion_value += Number(r.conversion_value) || 0
    }
  }
  return {
    total: finishTotals(total),
    byPlatform: Object.fromEntries(Object.entries(byPlatform).map(([k, v]) => [k, finishTotals(v)])),
  }
}

const RESULT_LABEL: Record<string, string> = { Mensagem: "conversas", Venda: "compras", Alcance: "alcance" }

export async function buildReportSnapshot(clientId: string, start: string, end: string): Promise<ReportSnapshot> {
  const supabase = await createClient()
  const { data: client, error } = await supabase
    .from("clients")
    .select("name, campaign_type")
    .eq("id", clientId)
    .single()
  if (error || !client) throw new Error("Cliente não encontrado")

  // Período anterior: mesma duração, imediatamente antes
  const days = Math.round((toDate(end).getTime() - toDate(start).getTime()) / DAY) + 1
  const prevEnd = new Date(toDate(start).getTime() - DAY)
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * DAY)

  const [currentRows, previousRows] = await Promise.all([
    fetchRows(clientId, start, end),
    fetchRows(clientId, fmt(prevStart), fmt(prevEnd)),
  ])
  const cur = summarize(currentRows)
  const prev = summarize(previousRows)

  const platforms: PlatformSummary[] = (["meta", "google"] as const)
    .filter((p) => cur.byPlatform[p] || prev.byPlatform[p])
    .map((p) => ({
      platform: p,
      current: cur.byPlatform[p] || finishTotals(emptyTotals()),
      previous: prev.byPlatform[p] || finishTotals(emptyTotals()),
    }))

  return {
    client_name: client.name,
    campaign_type: client.campaign_type ?? null,
    result_label: RESULT_LABEL[client.campaign_type as string] || "resultados",
    period: { start, end },
    previous_period: { start: fmt(prevStart), end: fmt(prevEnd) },
    total: { current: cur.total, previous: prev.total },
    platforms,
    generated_at: new Date().toISOString(),
  }
}

export async function createClientReport(data: {
  clientId: string
  start: string
  end: string
  title?: string
}): Promise<ClientReport> {
  const snapshot = await buildReportSnapshot(data.clientId, data.start, data.end)
  const supabase = await createClient()
  const fmtBR = (v: string) => v.split("-").reverse().join("/")

  const { data: result, error } = await supabase
    .from("client_reports")
    .insert({
      client_id: data.clientId,
      title: data.title?.trim() || `Relatório de tráfego — ${fmtBR(data.start)} a ${fmtBR(data.end)}`,
      period_start: data.start,
      period_end: data.end,
      snapshot,
    })
    .select("*")
    .single()

  if (error || !result) {
    console.error("[v0] Error creating report:", error)
    throw new Error(error?.message || "Não foi possível criar o relatório")
  }
  return { ...(result as ClientReport), client_name: snapshot.client_name }
}

export async function getClientReports(): Promise<ClientReport[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("client_reports")
      .select("*, clients:client_id (name)")
      .order("created_at", { ascending: false })
    if (error) {
      console.error("[v0] Error fetching reports:", error)
      return []
    }
    return (data || []).map((r: any) => ({ ...r, client_name: r.clients?.name ?? r.snapshot?.client_name }))
  } catch (error) {
    console.error("[v0] Error fetching reports:", error)
    return []
  }
}

export async function getClientReportById(id: string): Promise<ClientReport | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("client_reports").select("*").eq("id", id).maybeSingle()
  if (error || !data) return null
  return { ...(data as ClientReport), client_name: (data as any).snapshot?.client_name }
}

// Abertura pelo link do cliente: devolve o relatório e marca como visualizado
export async function getClientReportByToken(token: string): Promise<ClientReport | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("client_reports").select("*").eq("token", token).maybeSingle()
  if (error || !data) return null
  if (data.status === "enviado") {
    await supabase
      .from("client_reports")
      .update({ status: "visualizado", viewed_at: new Date().toISOString() })
      .eq("id", data.id)
  }
  return { ...(data as ClientReport), client_name: (data as any).snapshot?.client_name }
}

export async function markReportSent(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("client_reports")
    .update({ status: "enviado", sent_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "rascunho")
  if (error) throw new Error(error.message)
}

export async function deleteClientReport(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("client_reports").delete().eq("id", id)
  if (error) throw new Error(error.message)
}
