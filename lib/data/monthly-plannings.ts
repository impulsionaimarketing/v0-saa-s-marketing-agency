'use server'

import { createClient } from '@/lib/supabase/server'

export interface MonthlyPlanning {
  id: string
  client_id: string
  month: number
  year: number
  videos_qty: number
  artes_qty: number
  trafego_budget: number
  created_at: string
  updated_at: string
}

export interface MonthlyPlanningItem {
  id: string
  planning_id: string
  type: 'video' | 'arte'
  title: string
  description: string | null
  is_converted_to_demand: boolean
  demand_id: string | null
  created_at: string
  updated_at: string
}

export async function getMonthlyPlanningsByClient(clientId: string): Promise<MonthlyPlanning[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('monthly_plannings')
      .select('*')
      .eq('client_id', clientId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching monthly plannings:', error)
      throw new Error(error.message)
    }

    return data || []
  } catch (error) {
    console.error('[v0] Error fetching monthly plannings:', error)
    throw error
  }
}

export async function getMonthlyPlanning(clientId: string, month: number, year: number): Promise<MonthlyPlanning | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('monthly_plannings')
      .select('*')
      .eq('client_id', clientId)
      .eq('month', month)
      .eq('year', year)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[v0] Error fetching monthly planning:', error)
      throw new Error(error.message)
    }

    return data || null
  } catch (error) {
    console.error('[v0] Error fetching monthly planning:', error)
    throw error
  }
}

export async function upsertMonthlyPlanning(data: {
  client_id: string
  month: number
  year: number
  videos_qty: number
  artes_qty: number
  trafego_budget: number
}): Promise<MonthlyPlanning | null> {
  try {
    const supabase = await createClient()

    const { data: result, error } = await supabase.rpc('upsert_monthly_planning', {
      p_client_id: data.client_id,
      p_month: data.month,
      p_year: data.year,
      p_videos_qty: data.videos_qty,
      p_artes_qty: data.artes_qty,
      p_trafego_budget: data.trafego_budget,
    })

    if (error) {
      console.error('[v0] Error upserting monthly planning:', error)
      throw new Error(error.message)
    }

    return result as MonthlyPlanning
  } catch (error) {
    console.error('[v0] Error upserting monthly planning:', error)
    throw error
  }
}

export async function deleteMonthlyPlanning(id: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('monthly_plannings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[v0] Error deleting monthly planning:', error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('[v0] Error deleting monthly planning:', error)
    throw error
  }
}

// Planning Items Functions
export async function getPlanningItems(planningId: string): Promise<MonthlyPlanningItem[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('monthly_planning_items')
      .select('*')
      .eq('planning_id', planningId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[v0] Error fetching planning items:', error)
      throw new Error(error.message)
    }

    return data || []
  } catch (error) {
    console.error('[v0] Error fetching planning items:', error)
    throw error
  }
}

export async function createPlanningItem(data: {
  planning_id: string
  type: 'video' | 'arte'
  title: string
  description?: string
}): Promise<MonthlyPlanningItem | null> {
  try {
    const supabase = await createClient()
    const { data: result, error } = await supabase
      .from('monthly_planning_items')
      .insert({
        planning_id: data.planning_id,
        type: data.type,
        title: data.title,
        description: data.description || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating planning item:', error)
      throw new Error(error.message)
    }

    return result as MonthlyPlanningItem
  } catch (error) {
    console.error('[v0] Error creating planning item:', error)
    throw error
  }
}

export async function updatePlanningItem(id: string, data: {
  title?: string
  description?: string
}): Promise<MonthlyPlanningItem | null> {
  try {
    const supabase = await createClient()
    const { data: result, error } = await supabase
      .from('monthly_planning_items')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating planning item:', error)
      throw new Error(error.message)
    }

    return result as MonthlyPlanningItem
  } catch (error) {
    console.error('[v0] Error updating planning item:', error)
    throw error
  }
}

export async function deletePlanningItem(id: string): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('monthly_planning_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[v0] Error deleting planning item:', error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('[v0] Error deleting planning item:', error)
    throw error
  }
}

export async function convertItemToDemand(itemId: string, clientId: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    // Get the item details
    const { data: item, error: itemError } = await supabase
      .from('monthly_planning_items')
      .select('*')
      .eq('id', itemId)
      .single()

    if (itemError || !item) {
      throw new Error('Item not found')
    }

    // Create demand
    const { data: demand, error: demandError } = await supabase.rpc('insert_demand', {
      p_name: item.title,
      p_description: item.description,
      p_client_id: clientId,
      p_area: item.type === 'video' ? 'Vídeo' : 'Arte',
      p_responsible_id: null,
      p_deadline: null,
      p_status: 'A Fazer',
      p_priority: 'medium',
    })

    if (demandError) {
      console.error('[v0] Error creating demand:', demandError)
      throw new Error(demandError.message)
    }

    // Update item with demand_id and mark as converted
    const { error: updateError } = await supabase
      .from('monthly_planning_items')
      .update({
        is_converted_to_demand: true,
        demand_id: demand.id,
      })
      .eq('id', itemId)

    if (updateError) {
      console.error('[v0] Error updating item:', updateError)
      throw new Error(updateError.message)
    }

    return demand.id
  } catch (error) {
    console.error('[v0] Error converting item to demand:', error)
    throw error
  }
}
