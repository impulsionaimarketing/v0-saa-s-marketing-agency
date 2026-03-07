'use server'

import { createClient } from '@/lib/supabase/server'

export interface ClientMetrics {
  client_id: string
  client_name: string
  total_spend: number
  total_impressions: number
  total_clicks: number
  total_reach: number
  ctr: number
  cpc: number
  cpm: number
}

export interface CampaignMetrics {
  campaign_id: string
  campaign_name: string
  campaign_objective: string
  campaign_status: string
  total_spend: number
  total_impressions: number
  total_clicks: number
  total_reach: number
  ctr: number
  cpc: number
  cpm: number
}

export interface AdsetMetrics {
  adset_id: string
  adset_name: string
  total_spend: number
  total_impressions: number
  total_clicks: number
  total_reach: number
  ctr: number
  cpc: number
  cpm: number
}

export interface AdMetrics {
  ad_id: string
  ad_name: string
  total_spend: number
  total_impressions: number
  total_clicks: number
  total_reach: number
  ctr: number
  cpc: number
  cpm: number
}

// Get aggregated metrics by client
export async function getClientMetrics(startDate: string, endDate: string): Promise<ClientMetrics[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('meta_ads_insights_full')
      .select('client_id, client_name, spend, impressions, clicks, reach')
      .gte('report_date', startDate)
      .lte('report_date', endDate)

    if (error) {
      console.error('[v0] Error fetching client metrics:', error)
      throw new Error('Erro ao buscar métricas de clientes')
    }

    // Aggregate by client
    const clientMap = new Map<string, ClientMetrics>()

    data?.forEach((row: any) => {
      const clientId = row.client_id
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          client_id: clientId,
          client_name: row.client_name || clientId,
          total_spend: 0,
          total_impressions: 0,
          total_clicks: 0,
          total_reach: 0,
          ctr: 0,
          cpc: 0,
          cpm: 0,
        })
      }

      const client = clientMap.get(clientId)!
      client.total_spend += Number(row.spend) || 0
      client.total_impressions += Number(row.impressions) || 0
      client.total_clicks += Number(row.clicks) || 0
      client.total_reach += Number(row.reach) || 0
    })

    // Calculate derived metrics
    const clients = Array.from(clientMap.values()).map((client) => ({
      ...client,
      ctr: client.total_impressions > 0 ? (client.total_clicks / client.total_impressions) * 100 : 0,
      cpc: client.total_clicks > 0 ? client.total_spend / client.total_clicks : 0,
      cpm: client.total_impressions > 0 ? (client.total_spend / client.total_impressions) * 1000 : 0,
    }))

    return clients.sort((a, b) => b.total_spend - a.total_spend)
  } catch (error) {
    console.error('[v0] Error in getClientMetrics:', error)
    throw error
  }
}

// Get aggregated metrics by campaign for a specific client
export async function getCampaignMetrics(clientId: string, startDate: string, endDate: string): Promise<CampaignMetrics[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('meta_ads_insights_full')
      .select('campaign_id, campaign_name, campaign_objective, campaign_status, spend, impressions, clicks, reach')
      .eq('client_id', clientId)
      .gte('report_date', startDate)
      .lte('report_date', endDate)

    if (error) {
      console.error('[v0] Error fetching campaign metrics:', error)
      throw new Error('Erro ao buscar métricas de campanhas')
    }

    // Aggregate by campaign
    const campaignMap = new Map<string, CampaignMetrics>()

    data?.forEach((row: any) => {
      const campaignId = row.campaign_id
      if (!campaignMap.has(campaignId)) {
        campaignMap.set(campaignId, {
          campaign_id: campaignId,
          campaign_name: row.campaign_name || campaignId,
          campaign_objective: row.campaign_objective || 'N/A',
          campaign_status: row.campaign_status || 'UNKNOWN',
          total_spend: 0,
          total_impressions: 0,
          total_clicks: 0,
          total_reach: 0,
          ctr: 0,
          cpc: 0,
          cpm: 0,
        })
      }

      const campaign = campaignMap.get(campaignId)!
      campaign.total_spend += Number(row.spend) || 0
      campaign.total_impressions += Number(row.impressions) || 0
      campaign.total_clicks += Number(row.clicks) || 0
      campaign.total_reach += Number(row.reach) || 0
    })

    // Calculate derived metrics
    const campaigns = Array.from(campaignMap.values()).map((campaign) => ({
      ...campaign,
      ctr: campaign.total_impressions > 0 ? (campaign.total_clicks / campaign.total_impressions) * 100 : 0,
      cpc: campaign.total_clicks > 0 ? campaign.total_spend / campaign.total_clicks : 0,
      cpm: campaign.total_impressions > 0 ? (campaign.total_spend / campaign.total_impressions) * 1000 : 0,
    }))

    return campaigns.sort((a, b) => b.total_spend - a.total_spend)
  } catch (error) {
    console.error('[v0] Error in getCampaignMetrics:', error)
    throw error
  }
}

// Get aggregated metrics by adset for a specific campaign
export async function getAdsetMetrics(campaignId: string, startDate: string, endDate: string): Promise<AdsetMetrics[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('meta_ads_insights_full')
      .select('adset_id, adset_name, spend, impressions, clicks, reach')
      .eq('campaign_id', campaignId)
      .gte('report_date', startDate)
      .lte('report_date', endDate)

    if (error) {
      console.error('[v0] Error fetching adset metrics:', error)
      throw new Error('Erro ao buscar métricas de conjuntos')
    }

    // Aggregate by adset
    const adsetMap = new Map<string, AdsetMetrics>()

    data?.forEach((row: any) => {
      const adsetId = row.adset_id
      if (!adsetMap.has(adsetId)) {
        adsetMap.set(adsetId, {
          adset_id: adsetId,
          adset_name: row.adset_name || adsetId,
          total_spend: 0,
          total_impressions: 0,
          total_clicks: 0,
          total_reach: 0,
          ctr: 0,
          cpc: 0,
          cpm: 0,
        })
      }

      const adset = adsetMap.get(adsetId)!
      adset.total_spend += Number(row.spend) || 0
      adset.total_impressions += Number(row.impressions) || 0
      adset.total_clicks += Number(row.clicks) || 0
      adset.total_reach += Number(row.reach) || 0
    })

    // Calculate derived metrics
    const adsets = Array.from(adsetMap.values()).map((adset) => ({
      ...adset,
      ctr: adset.total_impressions > 0 ? (adset.total_clicks / adset.total_impressions) * 100 : 0,
      cpc: adset.total_clicks > 0 ? adset.total_spend / adset.total_clicks : 0,
      cpm: adset.total_impressions > 0 ? (adset.total_spend / adset.total_impressions) * 1000 : 0,
    }))

    return adsets.sort((a, b) => b.total_spend - a.total_spend)
  } catch (error) {
    console.error('[v0] Error in getAdsetMetrics:', error)
    throw error
  }
}

// Get aggregated metrics by ad for a specific adset
export async function getAdMetrics(adsetId: string, startDate: string, endDate: string): Promise<AdMetrics[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('meta_ads_insights_full')
      .select('ad_id, ad_name, spend, impressions, clicks, reach')
      .eq('adset_id', adsetId)
      .gte('report_date', startDate)
      .lte('report_date', endDate)

    if (error) {
      console.error('[v0] Error fetching ad metrics:', error)
      throw new Error('Erro ao buscar métricas de anúncios')
    }

    // Aggregate by ad
    const adMap = new Map<string, AdMetrics>()

    data?.forEach((row: any) => {
      const adId = row.ad_id
      if (!adMap.has(adId)) {
        adMap.set(adId, {
          ad_id: adId,
          ad_name: row.ad_name || adId,
          total_spend: 0,
          total_impressions: 0,
          total_clicks: 0,
          total_reach: 0,
          ctr: 0,
          cpc: 0,
          cpm: 0,
        })
      }

      const ad = adMap.get(adId)!
      ad.total_spend += Number(row.spend) || 0
      ad.total_impressions += Number(row.impressions) || 0
      ad.total_clicks += Number(row.clicks) || 0
      ad.total_reach += Number(row.reach) || 0
    })

    // Calculate derived metrics
    const ads = Array.from(adMap.values()).map((ad) => ({
      ...ad,
      ctr: ad.total_impressions > 0 ? (ad.total_clicks / ad.total_impressions) * 100 : 0,
      cpc: ad.total_clicks > 0 ? ad.total_spend / ad.total_clicks : 0,
      cpm: ad.total_impressions > 0 ? (ad.total_spend / ad.total_impressions) * 1000 : 0,
    }))

    return ads.sort((a, b) => b.total_spend - a.total_spend)
  } catch (error) {
    console.error('[v0] Error in getAdMetrics:', error)
    throw error
  }
}
