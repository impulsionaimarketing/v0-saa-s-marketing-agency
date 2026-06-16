'use server'

import { createClient } from '@/lib/supabase/server'

export async function getClientById(clientId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (error) {
      console.error('[v0] Error fetching client:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[v0] Error in getClientById:', error)
    return null
  }
}
