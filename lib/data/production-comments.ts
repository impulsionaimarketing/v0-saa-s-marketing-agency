'use server'

import { createClient } from '@/lib/supabase/server'

export interface ProductionComment {
  id: string
  production_id: string
  user_id: string | null
  author_name: string
  comment: string
  is_client: boolean
  created_at: string
}

// Fetch all comments for a single production, oldest first
export async function getProductionComments(
  productionId: string
): Promise<ProductionComment[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('production_comments')
      .select('*')
      .eq('production_id', productionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[v0] Error fetching production comments:', error)
      return []
    }

    return (data as ProductionComment[]) || []
  } catch (error) {
    console.error('[v0] Error fetching production comments:', error)
    return []
  }
}

// Returns a map of production_id -> number of client comments,
// used to show an alert badge on the pipeline cards.
export async function getClientCommentCounts(): Promise<Record<string, number>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('production_comments')
      .select('production_id')
      .eq('is_client', true)

    if (error) {
      console.error('[v0] Error fetching client comment counts:', error)
      return {}
    }

    const counts: Record<string, number> = {}
    for (const row of (data as { production_id: string }[]) || []) {
      counts[row.production_id] = (counts[row.production_id] || 0) + 1
    }

    return counts
  } catch (error) {
    console.error('[v0] Error fetching client comment counts:', error)
    return {}
  }
}
