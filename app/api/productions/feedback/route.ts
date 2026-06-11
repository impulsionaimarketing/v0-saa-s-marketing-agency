import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Retorna, para cada produção, a lista de comentários/alterações solicitados
// pelo cliente (mesclando production_comments e production_approvals).
export async function GET() {
  try {
    const supabase = await createClient()

    const [{ data: comments, error: commentsError }, { data: approvals, error: approvalsError }] =
      await Promise.all([
        supabase.from('production_comments').select('*'),
        supabase.from('production_approvals').select('*'),
      ])

    if (commentsError) {
      console.error('[feedback-all] erro ao buscar comentários:', commentsError)
    }
    if (approvalsError) {
      console.error('[feedback-all] erro ao buscar aprovações:', approvalsError)
    }

    // Agrupa por production_id, evitando textos duplicados
    type FeedbackItem = {
      id: string
      author: string
      comment: string
      date?: string
      is_client?: boolean
    }
    const byProduction = new Map<string, FeedbackItem[]>()
    const seenByProduction = new Map<string, Set<string>>()

    const pushItem = (
      productionId: string,
      id: string,
      author: string,
      comment?: string | null,
      date?: string,
      isClient?: boolean
    ) => {
      const text = comment?.trim()
      if (!productionId || !text) return
      if (!seenByProduction.has(productionId)) {
        seenByProduction.set(productionId, new Set())
        byProduction.set(productionId, [])
      }
      const seen = seenByProduction.get(productionId)!
      const key = text.toLowerCase()
      if (seen.has(key)) return
      seen.add(key)
      byProduction.get(productionId)!.push({
        id,
        author: author || 'Cliente',
        comment: text,
        date,
        is_client: isClient,
      })
    }

    for (const c of comments || []) {
      pushItem(
        c.production_id,
        c.id,
        c.author_name || 'Cliente',
        c.comment,
        c.created_at || c.inserted_at,
        c.is_client ?? true
      )
    }
    for (const a of approvals || []) {
      pushItem(
        a.production_id,
        a.id,
        a.approved_by || 'Cliente',
        a.comment,
        a.created_at || a.inserted_at,
        true
      )
    }

    // Ordena cada lista pela data mais recente primeiro
    const feedbackByProduction: Record<string, FeedbackItem[]> = {}
    for (const [productionId, items] of byProduction.entries()) {
      feedbackByProduction[productionId] = items.sort((a, b) => {
        const ta = a.date ? new Date(a.date).getTime() : 0
        const tb = b.date ? new Date(b.date).getTime() : 0
        return tb - ta
      })
    }

    return NextResponse.json({ feedbackByProduction })
  } catch (error: any) {
    console.error('[feedback-all] erro inesperado:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
