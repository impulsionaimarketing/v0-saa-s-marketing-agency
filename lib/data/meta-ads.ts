'use server'

import { createClient } from '@/lib/supabase/server'

export interface MetaAdsInsight {
  client_id: string
  client_name: string | null
  ad_account_id: string
  report_date: string
  campaign_id: string
  campaign_name: string | null
  adset_id: string
  adset_name: string | null
  ad_id: string
  ad_name: string | null
  impressions: number
  reach: number
  clicks: number
  spend: number
  frequency: number | null
  campaign_objective: string | null
  campaign_status: string | null
  updated_at: string
}

export async function getMetaAdsInsights(filters?: {
  clientId?: string
  campaignId?: string
  startDate?: string
  endDate?: string
}) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('meta_ads_insights_full')
      .select('*')
      .order('report_date', { ascending: false })

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId)
    }

    if (filters?.campaignId) {
      query = query.eq('campaign_id', filters.campaignId)
    }

    if (filters?.startDate) {
      query = query.gte('report_date', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('report_date', filters.endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('[v0] Error fetching meta ads insights:', error)
      throw new Error('Erro ao buscar dados de anúncios')
    }

    return (data as MetaAdsInsight[]) || []
  } catch (error) {
    console.error('[v0] Error in getMetaAdsInsights:', error)
    throw error
  }
}

export async function getUniqueClients() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('meta_ads_insights_full')
      .select('client_id, client_name')
      .order('client_name', { ascending: true })

    if (error) {
      throw new Error('Erro ao buscar clientes')
    }

    // Remove duplicates
    const uniqueClients = Array.from(
      new Map(data?.map((item: any) => [item.client_id, item]) || []).values()
    )

    return uniqueClients
  } catch (error) {
    console.error('[v0] Error fetching unique clients:', error)
    return []
  }
}

export async function getCampaignsByClient(clientId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('meta_ads_insights_full')
      .select('campaign_id, campaign_name')
      .eq('client_id', clientId)
      .order('campaign_name', { ascending: true })

    if (error) {
      throw new Error('Erro ao buscar campanhas')
    }

    // Remove duplicates
    const uniqueCampaigns = Array.from(
      new Map(data?.map((item: any) => [item.campaign_id, item]) || []).values()
    )

    return uniqueCampaigns
  } catch (error) {
    console.error('[v0] Error fetching campaigns:', error)
    return []
  }
}
