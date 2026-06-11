'use server'

async function createAnonClient() {
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export interface ProductionApproval {
  id: string
  production_id: string
  action: string
  comment: string | null
  approved_by: string | null
  created_at: string
}

// ─── Buscar aprovações e comentários de uma produção ─────────────────────────
export async function getProductionApprovals(
  productionId: string
): Promise<ProductionApproval[]> {
  try {
    const supabase = await createAnonClient()

    // Busca aprovações (aprovado/reprovado)
    const { data: approvals } = await supabase
      .from('production_approvals')
      .select('id, production_id, action, comment, approved_by, created_at')
      .eq('production_id', productionId)
      .order('created_at', { ascending: true })

    // Busca comentários do cliente
    const { data: comments } = await supabase
      .from('production_comments')
      .select('id, production_id, comment, author_name, is_client, created_at')
      .eq('production_id', productionId)
      .order('created_at', { ascending: true })

    // Normaliza comentários para o mesmo formato
    const normalizedComments: ProductionApproval[] = (comments || []).map((c) => ({
      id: c.id,
      production_id: c.production_id,
      action: c.is_client ? 'comentario_cliente' : 'comentario',
      comment: c.comment,
      approved_by: c.author_name,
      created_at: c.created_at,
    }))

    // Une e ordena por data
    const all = [...(approvals || []), ...normalizedComments]
    all.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    return all as ProductionApproval[]
  } catch (error) {
    console.error('[v0] Error fetching production approvals:', error)
    return []
  }
}

// ─── Contagem de pedidos de ajuste por produção ───────────────────────────────
export async function getAdjustmentCounts(
  productionIds: string[]
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  if (productionIds.length === 0) return counts
  try {
    const supabase = await createAnonClient()
    const { data, error } = await supabase
      .from('production_approvals')
      .select('production_id, action')
      .eq('action', 'reprovado')
      .in('production_id', productionIds)

    if (error) return counts

    for (const row of data || []) {
      const id = row.production_id as string
      counts[id] = (counts[id] || 0) + 1
    }
    return counts
  } catch (error) {
    console.error('[v0] Error counting adjustments:', error)
    return counts
  }
}

// ─── Adicionar anotação interna da equipe ─────────────────────────────────────
export async function addTeamNote(params: {
  productionId: string
  comment: string
  authorName: string
}): Promise<ProductionApproval | null> {
  try {
    const supabase = await createAnonClient()
    const { data, error } = await supabase
      .from('production_approvals')
      .insert({
        production_id: params.productionId,
        action: 'comentario',
        comment: params.comment.trim(),
        approved_by: params.authorName,
      })
      .select('id, production_id, action, comment, approved_by, created_at')
      .single()

    if (error) throw new Error(error.message)

    return data as ProductionApproval
  } catch (error) {
    console.error('[v0] Error adding team note:', error)
    throw error
  }
}
