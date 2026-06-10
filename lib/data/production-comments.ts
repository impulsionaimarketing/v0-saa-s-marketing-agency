'use server'

import { createClient } from '@/lib/supabase/server'

export interface ProductionComment {
  id: string
  production_id: string
  user_id?: string | null
  author_name: string
  comment: string
  is_client: boolean
  created_at: string
}

// ─── Buscar comentários de uma produção (mais antigos primeiro) ───────────────
export async function getProductionComments(
  productionId: string
): Promise<ProductionComment[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('production_comments')
      .select('id, production_id, user_id, author_name, comment, is_client, created_at')
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

// ─── Contagem de comentários do cliente por produção ──────────────────────────
// Usado para exibir o selo de "pedido de alteração" nos cards do pipeline.
export async function getClientCommentCounts(
  productionIds: string[]
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  if (productionIds.length === 0) return counts

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('production_comments')
      .select('production_id')
      .eq('is_client', true)
      .in('production_id', productionIds)

    if (error) {
      console.error('[v0] Error counting client comments:', error)
      return counts
    }

    for (const row of data || []) {
      const id = row.production_id as string
      counts[id] = (counts[id] || 0) + 1
    }

    return counts
  } catch (error) {
    console.error('[v0] Error counting client comments:', error)
    return counts
  }
}

// ─── Adicionar comentário interno da equipe ───────────────────────────────────
export async function addTeamComment(params: {
  productionId: string
  comment: string
  authorName: string
  userId?: string
}): Promise<ProductionComment | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('production_comments')
      .insert({
        production_id: params.productionId,
        author_name: params.authorName,
        comment: params.comment.trim(),
        is_client: false,
        user_id: params.userId || null,
      })
      .select('id, production_id, user_id, author_name, comment, is_client, created_at')
      .single()

    if (error) {
      console.error('[v0] Error adding team comment:', error)
      throw new Error(error.message)
    }

    return data as ProductionComment
  } catch (error) {
    console.error('[v0] Error adding team comment:', error)
    throw error
  }
}
