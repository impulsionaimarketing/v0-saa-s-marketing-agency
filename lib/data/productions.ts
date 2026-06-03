'use server'

import { createClient } from '@/lib/supabase/server'
import { sendWebhookNotification } from '@/lib/webhooks/send-notification'

// Helper function to fetch production files
async function getProductionFilesForWebhook(productionId: string) {
  try {
    const supabase = await createClient()
    const { data: files } = await supabase
      .from('production_files')
      .select('id, filename, url, file_size, file_type, uploaded_at')
      .eq('production_id', productionId)
      .order('uploaded_at', { ascending: false })
    
    return files || []
  } catch (error) {
    console.error('[v0] Error fetching files for webhook:', error)
    return []
  }
}

export interface ProductionFile {
  id: string
  filename: string
  url: string
  file_size?: number
  file_type?: string
  uploaded_at?: string
}

export interface Production {
  id: string
  client_id: string
  client_name?: string
  type: 'Vídeo' | 'Arte'
  responsible_id?: string
  responsible_name?: string
  status: string
  post_date?: string
  notes?: string
  demand_id?: string
  created_at: string
  title?: string
  caption?: string
  approval_token?: string
  files?: ProductionFile[]
}

export async function getProductions(filters?: {
  current_user_id?: string
  current_user_role?: string
}): Promise<Production[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_all_productions')

    if (error) {
      console.error('[v0] Error fetching productions:', error)
      return []
    }

    let productions = (data as Production[]) || []

    // Filter by user role: Colaboradores only see their own productions
    if (filters?.current_user_role === 'Colaborador' && filters?.current_user_id) {
      console.log('[v0] Filtering productions for Colaborador:', filters.current_user_id)
      productions = productions.filter((p: Production) => p.responsible_id === filters.current_user_id)
    }

    // Fetch files for each production
    if (productions.length > 0) {
      const productionIds = productions.map(p => p.id)
      const { data: allFiles } = await supabase
        .from('production_files')
        .select('id, production_id, filename, url, file_size, file_type, uploaded_at')
        .in('production_id', productionIds)
        .order('uploaded_at', { ascending: false })

      if (allFiles) {
        const filesMap = new Map<string, ProductionFile[]>()
        for (const file of allFiles) {
          const prodId = file.production_id as string
          if (!filesMap.has(prodId)) {
            filesMap.set(prodId, [])
          }
          filesMap.get(prodId)!.push({
            id: file.id,
            filename: file.filename,
            url: file.url,
            file_size: file.file_size,
            file_type: file.file_type,
            uploaded_at: file.uploaded_at
          })
        }

        productions = productions.map(p => ({
          ...p,
          files: filesMap.get(p.id) || []
        }))
      }
    }

    return productions
  } catch (error) {
    console.error('[v0] Error fetching productions:', error)
    return []
  }
}

export async function createProduction(data: {
  client_id: string
  type: 'Vídeo' | 'Arte'
  responsible_id?: string
  status?: string
  post_date?: string
  notes?: string
}): Promise<Production | null> {
  try {
    const supabase = await createClient()

    // Use RPC - cast types explicitly to text to match one specific overload
    const params = {
      p_client_id: data.client_id,
      p_type: data.type,
      p_responsible_id: data.responsible_id || null,
      p_status: data.status || 'Planejamento',
      p_post_date: data.post_date || null,
      p_notes: data.notes || null,
    }
    
    const { data: result, error } = await supabase.rpc('insert_production', params)

    if (error) {
      console.error('[v0] Error creating production:', error)
      throw new Error(error.message)
    }

    // Get associated files and send webhook notification
    const files = await getProductionFilesForWebhook(result.id)
    await sendWebhookNotification('production.created', { ...result, files })

    return result as Production
  } catch (error) {
    console.error('[v0] Error creating production:', error)
    throw error
  }
}

export async function updateProduction(
  id: string,
  data: Partial<Production>
): Promise<Production | null> {
  try {
    const supabase = await createClient()

    // First get the current production to check if it has demand_id
    const { data: currentProduction } = await supabase
      .from('productions')
      .select('demand_id')
      .eq('id', id)
      .single()

    // Update the production
    const { data: result, error } = await supabase
      .from('productions')
      .update({
        client_id: data.client_id,
        type: data.type,
        responsible_id: data.responsible_id,
        status: data.status,
        post_date: data.post_date,
        notes: data.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating production:', error)
      throw new Error(error.message)
    }

    // If this production is linked to a demand, sync the changes
    if (currentProduction?.demand_id) {
      console.log('[v0] Syncing production changes to linked demand:', currentProduction.demand_id)
      await supabase
        .from('demands')
        .update({
          responsible_id: data.responsible_id,
          status: mapProductionStatusToDemandStatus(data.status),
          deadline: data.post_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentProduction.demand_id)
    }

    // Get associated files and send webhook notification
    const files = await getProductionFilesForWebhook(id)
    await sendWebhookNotification('production.updated', { id, ...result, files })

    return result as Production
  } catch (error) {
    console.error('[v0] Error updating production:', error)
    throw error
  }
}

// Helper function to map production status to demand status
function mapProductionStatusToDemandStatus(productionStatus?: string): string {
  const statusMap: Record<string, string> = {
    'Planejamento': 'A Fazer',
    'Produção': 'Em Produção',
    'Revisão': 'Em Revisão',
    'Aprovado': 'Aprovado',
    'Publicado': 'Publicado'
  }
  return productionStatus ? (statusMap[productionStatus] || 'A Fazer') : 'A Fazer'
}

export async function updateProductionStatus(
  id: string,
  status: string
): Promise<Production | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('update_production_status', {
      p_id: id,
      p_status: status,
    })

    if (error) {
      console.error('[v0] Error updating production status:', error)
      throw new Error(error.message)
    }

    // Get associated files and send webhook notification
    const files = await getProductionFilesForWebhook(id)
    await sendWebhookNotification('production.status_changed', { id, status, ...data, files })

    return data as Production
  } catch (error) {
    console.error('[v0] Error updating production status:', error)
    throw error
  }
}

export async function deleteProduction(id: string): Promise<void> {
  try {
    const supabase = await createClient()

    // Get files before deletion for webhook
    const files = await getProductionFilesForWebhook(id)

    const { error } = await supabase.rpc('delete_production_by_id', { p_id: id })

    if (error) {
      console.error('[v0] Error deleting production:', error)
      throw new Error(error.message)
    }

    // Send webhook notification with files info
    await sendWebhookNotification('production.deleted', { id, files })
  } catch (error) {
    console.error('[v0] Error deleting production:', error)
    throw error
  }
}
