'use server'

import { createClient } from '@/lib/supabase/server'

// Tráfego pago (Meta Ads + Google Ads) lido da tabela ads_insights_daily,
// alimentada pelo fluxo "Tráfego pago - sincronizar" do n8n.
// O nome do arquivo é antigo; as funções continuam as mesmas para a página.

export type AdsPlatform = 'meta' | 'google'
export type PlatformFilter = AdsPlatform | 'all'

interface BaseMetrics {
  total_spend: number
  total_impressions: number
  total_clicks: number
  total_reach: number
  total_results: number
  total_conversion_value: number
  result_type: string | null
  ctr: number
  cpc: number
  cpm: number
  cost_per_result: number
}

export interface ClientMetrics extends BaseMetrics {
  client_id: string
  client_name: string
}

export interface CampaignMetrics extends BaseMetrics {
  campaign_id: string
  campaign_name: string
  campaign_objective: string
  campaign_status: string
  platform: AdsPlatform
}

export interface AdsetMetrics extends BaseMetrics {
  adset_id: string
  adset_name: string
}

export interface AdMetrics extends BaseMetrics {
  ad_id: string
  ad_name: string
}

export interface AdsSyncInfo {
  lastOkAt: string | null
  errors: { platform: string; client_name: string | null; error: string | null }[]
}

const COLUMNS =
  'platform, client_id, client_name, report_date, campaign_id, campaign_name, campaign_objective, campaign_status, ' +
  'adset_id, adset_name, ad_id, ad_name, spend, impressions, clicks, reach, results, result_type, conversion_value'

// O Supabase devolve no máximo 1000 linhas por consulta: lê em páginas
async function fetchAll(
  build: (query: any) => any,
): Promise<any[]> {
  const supabase = await createClient()
  const pageSize = 1000
  const all: any[] = []
  for (let from = 0; ; from += pageSize) {
    const query = build(supabase.from('ads_insights_daily').select(COLUMNS)).range(from, from + pageSize - 1)
    const { data, error } = await query
    if (error) {
      console.error('[v0] Error fetching ads insights:', error)
      throw new Error('Erro ao buscar dados de anúncios')
    }
    all.push(...(data || []))
    if (!data || data.length < pageSize) break
  }
  return all
}

function emptyMetrics(): BaseMetrics {
  return {
    total_spend: 0, total_impressions: 0, total_clicks: 0, total_reach: 0,
    total_results: 0, total_conversion_value: 0, result_type: null,
    ctr: 0, cpc: 0, cpm: 0, cost_per_result: 0,
  }
}

function accumulate(m: BaseMetrics, row: any) {
  m.total_spend += Number(row.spend) || 0
  m.total_impressions += Number(row.impressions) || 0
  m.total_clicks += Number(row.clicks) || 0
  m.total_reach += Number(row.reach) || 0
  m.total_results += Number(row.results) || 0
  m.total_conversion_value += Number(row.conversion_value) || 0
  // Tipo de resultado: o primeiro que aparecer (mistura de tipos fica como "resultados")
  if (row.result_type) {
    if (!m.result_type) m.result_type = row.result_type
    else if (m.result_type !== row.result_type) m.result_type = 'resultados'
  }
}

function finish<T extends BaseMetrics>(m: T): T {
  return {
    ...m,
    ctr: m.total_impressions > 0 ? (m.total_clicks / m.total_impressions) * 100 : 0,
    cpc: m.total_clicks > 0 ? m.total_spend / m.total_clicks : 0,
    cpm: m.total_impressions > 0 ? (m.total_spend / m.total_impressions) * 1000 : 0,
    cost_per_result: m.total_results > 0 ? m.total_spend / m.total_results : 0,
  }
}

function withPlatform(query: any, platform?: PlatformFilter) {
  return platform && platform !== 'all' ? query.eq('platform', platform) : query
}

export async function getClientMetrics(
  startDate: string,
  endDate: string,
  platform?: PlatformFilter,
): Promise<ClientMetrics[]> {
  const rows = await fetchAll((q) =>
    withPlatform(q.gte('report_date', startDate).lte('report_date', endDate), platform),
  )

  const map = new Map<string, ClientMetrics>()
  for (const row of rows) {
    // Histórico antigo sem cliente correspondente não entra na visão por cliente
    if (!row.client_id) continue
    const id = row.client_id
    if (!map.has(id)) map.set(id, { client_id: id, client_name: row.client_name || id, ...emptyMetrics() })
    accumulate(map.get(id)!, row)
  }
  return Array.from(map.values()).map(finish).sort((a, b) => b.total_spend - a.total_spend)
}

export async function getCampaignMetrics(
  clientId: string,
  startDate: string,
  endDate: string,
  platform?: PlatformFilter,
): Promise<CampaignMetrics[]> {
  const rows = await fetchAll((q) =>
    withPlatform(q.eq('client_id', clientId).gte('report_date', startDate).lte('report_date', endDate), platform),
  )

  const map = new Map<string, CampaignMetrics & { _lastDate: string }>()
  for (const row of rows) {
    const key = `${row.platform}:${row.campaign_id}`
    if (!map.has(key)) {
      map.set(key, {
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name || row.campaign_id,
        campaign_objective: row.campaign_objective || '',
        campaign_status: row.campaign_status || '',
        platform: row.platform,
        _lastDate: row.report_date,
        ...emptyMetrics(),
      })
    }
    const c = map.get(key)!
    accumulate(c, row)
    // Status e objetivo vêm da linha mais recente
    if (row.report_date >= c._lastDate) {
      c._lastDate = row.report_date
      if (row.campaign_status) c.campaign_status = row.campaign_status
      if (row.campaign_objective) c.campaign_objective = row.campaign_objective
    }
  }
  return Array.from(map.values())
    .map(({ _lastDate, ...c }) => finish(c))
    .sort((a, b) => b.total_spend - a.total_spend)
}

export async function getAdsetMetrics(
  campaignId: string,
  startDate: string,
  endDate: string,
  platform?: PlatformFilter,
): Promise<AdsetMetrics[]> {
  const rows = await fetchAll((q) =>
    withPlatform(q.eq('campaign_id', campaignId).gte('report_date', startDate).lte('report_date', endDate), platform),
  )

  const map = new Map<string, AdsetMetrics>()
  for (const row of rows) {
    const id = row.adset_id ?? ''
    if (!map.has(id)) {
      map.set(id, { adset_id: id, adset_name: row.adset_name || row.campaign_name || 'Sem grupo', ...emptyMetrics() })
    }
    accumulate(map.get(id)!, row)
  }
  return Array.from(map.values()).map(finish).sort((a, b) => b.total_spend - a.total_spend)
}

export async function getAdMetrics(
  adsetId: string,
  startDate: string,
  endDate: string,
  platform?: PlatformFilter,
  campaignId?: string,
): Promise<AdMetrics[]> {
  const rows = await fetchAll((q) => {
    let query = q.eq('adset_id', adsetId).gte('report_date', startDate).lte('report_date', endDate)
    if (campaignId) query = query.eq('campaign_id', campaignId)
    return withPlatform(query, platform)
  })

  const map = new Map<string, AdMetrics>()
  for (const row of rows) {
    const id = row.ad_id
    if (!map.has(id)) map.set(id, { ad_id: id, ad_name: row.ad_name || id, ...emptyMetrics() })
    accumulate(map.get(id)!, row)
  }
  return Array.from(map.values()).map(finish).sort((a, b) => b.total_spend - a.total_spend)
}

// Última atualização bem-sucedida e erros recentes (para a aba mostrar o estado)
export async function getAdsSyncInfo(): Promise<AdsSyncInfo> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('ads_sync_runs')
      .select('started_at, platform, client_name, status, error')
      .order('started_at', { ascending: false })
      .limit(40)
    if (error || !data) return { lastOkAt: null, errors: [] }

    const lastOk = data.find((r: any) => r.status === 'ok')
    // Só vale o resultado mais recente de cada cliente × plataforma: um erro antigo
    // já corrigido por uma execução posterior não deve alarmar.
    const seen = new Set<string>()
    const errors: AdsSyncInfo['errors'] = []
    for (const r of data as any[]) {
      const key = `${r.platform}|${r.client_name}`
      if (seen.has(key)) continue
      seen.add(key)
      if (r.status === 'erro') errors.push({ platform: r.platform, client_name: r.client_name, error: r.error })
    }
    return { lastOkAt: lastOk?.started_at ?? null, errors }
  } catch (error) {
    console.error('[v0] Error fetching ads sync info:', error)
    return { lastOkAt: null, errors: [] }
  }
}
