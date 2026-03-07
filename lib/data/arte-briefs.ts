'use server'

import { createClient } from '@/lib/supabase/server'

export interface ArteBrief {
  id: string
  client_id: string
  name: string
  format: string | null
  reference_links: string | null
  description: string | null
  colors: string | null
  elements: string | null
  responsible_id: string | null
  responsible_name?: string
  deadline: string | null
  status: string
  is_converted_to_demand: boolean
  demand_id: string | null
  month: number | null
  year: number | null
  created_at: string
  updated_at: string
}

export async function getArteBriefs(clientId: string, month?: number, year?: number): Promise<ArteBrief[]> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('arte_briefs')
      .select(`
        *,
        users:responsible_id (name)
      `)
      .eq('client_id', clientId)
    
    if (month !== undefined && year !== undefined) {
      query = query.eq('month', month).eq('year', year)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching arte briefs:', error)
      throw new Error(error.message)
    }

    return (data || []).map((item: any) => ({
      ...item,
      responsible_name: item.users?.name || null,
    }))
  } catch (error) {
    console.error('[v0] Error fetching arte briefs:', error)
    return []
  }
}

export async function createArteBrief(data: {
  client_id: string
  name: string
  format?: string
  reference_links?: string
  description?: string
  colors?: string
  elements?: string
  responsible_id?: string
  deadline?: string
  month?: number
  year?: number
}): Promise<ArteBrief | null> {
  try {
    const supabase = await createClient()
    const { data: result, error } = await supabase
      .from('arte_briefs')
      .insert({
        client_id: data.client_id,
        name: data.name,
        format: data.format || null,
        reference_links: data.reference_links || null,
        description: data.description || null,
        colors: data.colors || null,
        elements: data.elements || null,
        responsible_id: data.responsible_id || null,
        deadline: data.deadline || null,
        month: data.month || null,
        year: data.year || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating arte brief:', error)
      throw new Error(error.message)
    }

    return result as ArteBrief
  } catch (error) {
    console.error('[v0] Error creating arte brief:', error)
    throw error
  }
}

export async function updateArteBrief(id: string, data: Partial<ArteBrief>): Promise<ArteBrief | null> {
  try {
    const supabase = await createClient()
    
    // First get the current arte brief to check if it has demand_id
    const { data: currentBrief } = await supabase
      .from('arte_briefs')
      .select('demand_id')
      .eq('id', id)
      .single()
    
    const { data: result, error } = await supabase
      .from('arte_briefs')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating arte brief:', error)
      throw new Error(error.message)
    }

    // If this arte brief is linked to a demand, sync the changes
    if (currentBrief?.demand_id) {
      console.log('[v0] Syncing arte brief changes to linked demand:', currentBrief.demand_id)
      await supabase
        .from('demands')
        .update({
          name: data.name,
          description: data.description,
          responsible_id: data.responsible_id,
          deadline: data.deadline,
          status: mapArteStatusToDemandStatus(data.status),
          updated_at: new Date().toISOString()
        })
        .eq('id', currentBrief.demand_id)
    }

    return result as ArteBrief
  } catch (error) {
    console.error('[v0] Error updating arte brief:', error)
    throw error
  }
}

// Helper function to map arte brief status to demand status
function mapArteStatusToDemandStatus(arteStatus?: string): string {
  const statusMap: Record<string, string> = {
    'Pendente': 'A Fazer',
    'Em Criação': 'Em Produção',
    'Em Revisão': 'Em Revisão',
    'Aprovado': 'Aprovado',
    'Finalizado': 'Publicado'
  }
  return arteStatus ? (statusMap[arteStatus] || 'A Fazer') : 'A Fazer'
}

export async function getArteBriefByDemandId(demandId: string): Promise<ArteBrief | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('arte_briefs')
      .select(`*, users:responsible_id (name)`)
      .eq('demand_id', demandId)
      .single()
    if (error || !data) return null
    return { ...data, responsible_name: data.users?.name || null }
  } catch {
    return null
  }
}

export async function deleteArteBrief(id: string): Promise<void> {
  try {
  const supabase = await createClient()
  const { error } = await supabase
  .from('arte_briefs')
  .delete()
  .eq('id', id)

  if (error) {
  console.error('[v0] Error deleting arte brief:', error)
  throw new Error(error.message)
  }
  } catch (error) {
  console.error('[v0] Error deleting arte brief:', error)
  throw error
  }
}

export async function deleteAllArteBriefsByClient(clientId: string): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('arte_briefs')
      .delete()
      .eq('client_id', clientId)

    if (error) {
      console.error('[v0] Error deleting arte briefs:', error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('[v0] Error deleting arte briefs:', error)
    throw error
  }
}

export async function convertArteBriefToDemand(briefId: string, clientId: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    const { data: brief, error: briefError } = await supabase
      .from('arte_briefs')
      .select('*')
      .eq('id', briefId)
      .single()

    if (briefError || !brief) {
      throw new Error('Brief not found')
    }

    const { data: demandId, error: demandError } = await supabase.rpc('insert_demand', {
      p_name: brief.name,
      p_description: brief.description || '',
      p_client_id: clientId,
      p_area: 'Arte',
      p_responsible_id: brief.responsible_id,
      p_deadline: brief.deadline,
      p_status: 'A Fazer',
      p_priority: 'medium',
    })

    if (demandError) {
      console.error('[v0] Error creating demand:', demandError)
      throw new Error(demandError.message)
    }

    if (!demandId) {
      throw new Error('No demand ID returned')
    }

    const { error: updateError } = await supabase
      .from('arte_briefs')
      .update({
        is_converted_to_demand: true,
        demand_id: demandId,
      })
      .eq('id', briefId)

    if (updateError) {
      console.error('[v0] Error updating brief:', updateError)
      throw new Error(updateError.message)
    }

    return demandId
  } catch (error) {
    console.error('[v0] Error converting brief to demand:', error)
    throw error
  }
}
