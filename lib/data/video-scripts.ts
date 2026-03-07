'use server'

import { createClient } from '@/lib/supabase/server'

export interface VideoScript {
  id: string
  client_id: string
  name: string
  format: string | null
  reference_links: string | null
  script_text: string | null
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

export async function getVideoScripts(clientId: string, month?: number, year?: number): Promise<VideoScript[]> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('video_scripts')
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
      console.error('[v0] Error fetching video scripts:', error)
      throw new Error(error.message)
    }

    return (data || []).map((item: any) => ({
      ...item,
      responsible_name: item.users?.name || null,
    }))
  } catch (error) {
    console.error('[v0] Error fetching video scripts:', error)
    return []
  }
}

export async function createVideoScript(data: {
  client_id: string
  name: string
  format?: string
  reference_links?: string
  script_text?: string
  responsible_id?: string
  deadline?: string
  month?: number
  year?: number
}): Promise<VideoScript | null> {
  try {
    const supabase = await createClient()
    const { data: result, error } = await supabase
      .from('video_scripts')
      .insert({
        client_id: data.client_id,
        name: data.name,
        format: data.format || null,
        reference_links: data.reference_links || null,
        script_text: data.script_text || null,
        responsible_id: data.responsible_id || null,
        deadline: data.deadline || null,
        month: data.month || null,
        year: data.year || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating video script:', error)
      throw new Error(error.message)
    }

    return result as VideoScript
  } catch (error) {
    console.error('[v0] Error creating video script:', error)
    throw error
  }
}

export async function updateVideoScript(id: string, data: Partial<VideoScript>): Promise<VideoScript | null> {
  try {
    const supabase = await createClient()
    
    // First get the current video script to check if it has demand_id
    const { data: currentScript } = await supabase
      .from('video_scripts')
      .select('demand_id')
      .eq('id', id)
      .single()
    
    const { data: result, error } = await supabase
      .from('video_scripts')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating video script:', error)
      throw new Error(error.message)
    }

    // If this video script is linked to a demand, sync the changes
    if (currentScript?.demand_id) {
      console.log('[v0] Syncing video script changes to linked demand:', currentScript.demand_id)
      await supabase
        .from('demands')
        .update({
          name: data.name,
          description: data.script_text,
          responsible_id: data.responsible_id,
          deadline: data.deadline,
          status: mapVideoStatusToDemandStatus(data.status),
          updated_at: new Date().toISOString()
        })
        .eq('id', currentScript.demand_id)
    }

    return result as VideoScript
  } catch (error) {
    console.error('[v0] Error updating video script:', error)
    throw error
  }
}

// Helper function to map video script status to demand status
function mapVideoStatusToDemandStatus(videoStatus?: string): string {
  const statusMap: Record<string, string> = {
    'Pendente': 'A Fazer',
    'Em Roteiro': 'Em Produção',
    'Roteiro Aprovado': 'Aprovado',
    'Em Gravação': 'Em Produção',
    'Em Edição': 'Em Produção',
    'Finalizado': 'Publicado'
  }
  return videoStatus ? (statusMap[videoStatus] || 'A Fazer') : 'A Fazer'
}

export async function getVideoScriptByDemandId(demandId: string): Promise<VideoScript | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('video_scripts')
      .select(`*, users:responsible_id (name)`)
      .eq('demand_id', demandId)
      .single()
    if (error || !data) return null
    return { ...data, responsible_name: data.users?.name || null }
  } catch {
    return null
  }
}

export async function deleteVideoScript(id: string): Promise<void> {
  try {
  const supabase = await createClient()
  const { error } = await supabase
  .from('video_scripts')
  .delete()
  .eq('id', id)

  if (error) {
  console.error('[v0] Error deleting video script:', error)
  throw new Error(error.message)
  }
  } catch (error) {
  console.error('[v0] Error deleting video script:', error)
  throw error
  }
}

export async function deleteAllVideoScriptsByClient(clientId: string): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('video_scripts')
      .delete()
      .eq('client_id', clientId)

    if (error) {
      console.error('[v0] Error deleting video scripts:', error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('[v0] Error deleting video scripts:', error)
    throw error
  }
}

export async function convertVideoScriptToDemand(scriptId: string, clientId: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    const { data: script, error: scriptError } = await supabase
      .from('video_scripts')
      .select('*')
      .eq('id', scriptId)
      .single()

    if (scriptError || !script) {
      throw new Error('Script not found')
    }

    const { data: demandId, error: demandError } = await supabase.rpc('insert_demand', {
      p_name: script.name,
      p_description: script.script_text || '',
      p_client_id: clientId,
      p_area: 'Vídeo',
      p_responsible_id: script.responsible_id,
      p_deadline: script.deadline,
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
      .from('video_scripts')
      .update({
        is_converted_to_demand: true,
        demand_id: demandId,
      })
      .eq('id', scriptId)

    if (updateError) {
      console.error('[v0] Error updating script:', updateError)
      throw new Error(updateError.message)
    }

    return demandId
  } catch (error) {
    console.error('[v0] Error converting script to demand:', error)
    throw error
  }
}
