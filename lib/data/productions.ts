'use server'

import { createClient } from '@/lib/supabase/server'

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
  created_at: string
}

export async function getProductions(): Promise<Production[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_all_productions')

    if (error) {
      console.error('[v0] Error fetching productions:', error)
      return []
    }

    return (data as Production[]) || []
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

    const { data: result, error } = await supabase.rpc('insert_production', {
      p_client_id: data.client_id,
      p_type: data.type,
      p_responsible_id: data.responsible_id || null,
      p_status: data.status || 'Planejamento',
      p_post_date: data.post_date || null,
      p_notes: data.notes || null,
    })

    if (error) {
      console.error('[v0] Error creating production:', error)
      throw new Error(error.message)
    }

    return result as Production
  } catch (error) {
    console.error('[v0] Error creating production:', error)
    throw error
  }
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

    return data as Production
  } catch (error) {
    console.error('[v0] Error updating production status:', error)
    throw error
  }
}

export async function deleteProduction(id: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.rpc('delete_production_by_id', { p_id: id })

    if (error) {
      console.error('[v0] Error deleting production:', error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('[v0] Error deleting production:', error)
    throw error
  }
}
