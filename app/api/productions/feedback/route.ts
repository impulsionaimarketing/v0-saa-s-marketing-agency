import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type FeedbackItem = {
  id: string
  author: string
  comment: string
  date?: string
  is_client?: boolean
  source?: string
}

type ProductionInfo = {
  id: string
  title?: string
  status: string
  client_name?: string
  thumbnail_url?: string | null
  thumbnail_is_video?: boolean
}

// Retorna a lista de produções que receberam comentários/alterações do cliente.
// Usa a RPC get_production_feedback (SECURITY DEFINER) para ignorar o RLS das
// tabelas production_comments e production_approvals — mesmo padrão de
// get_all_productions, usado em todo o app.
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_production_feedback')

    if (error) {
      console.error('[feedback-all] erro na RPC get_production_feedback:', error)
      return NextResponse.json({ items: [], error: error.message }, { status: 200 })
    }

    const rows = (data || []) as Array<{
      feedback_id: string
      production_id: string
      production_title: string | null
      production_status: string | null
      client_name: string | null
      thumbnail_url: string | null
      author: string | null
      comment: string | null
      is_client: boolean | null
      source: string | null
      created_at: string | null
    }>

    // Agrupa por produção, deduplicando textos repetidos (mesmo comentário
    // gravado em production_comments e production_approvals)
    const byProduction = new Map<
      string,
      { production: ProductionInfo; feedback: FeedbackItem[] }
    >()
    const seenByProduction = new Map<string, Set<string>>()

    for (const r of rows) {
      const text = r.comment?.trim()
      if (!r.production_id || !text) continue
      // Só mostramos produções que estão aguardando ajuste do editor
      if ((r.production_status || '') !== 'Solicitou Ajuste') continue

      if (!byProduction.has(r.production_id)) {
        byProduction.set(r.production_id, {
          production: {
            id: r.production_id,
            title: r.production_title || 'Produção sem título',
            status: r.production_status || 'Solicitou Ajuste',
            client_name: r.client_name || undefined,
            thumbnail_url: r.thumbnail_url,
            thumbnail_is_video:
              (r.thumbnail_url || '').match(/\.(mp4|mov|webm|m4v)(\?|$)/i) !== null,
          },
          feedback: [],
        })
        seenByProduction.set(r.production_id, new Set())
      }

      const seen = seenByProduction.get(r.production_id)!
      const key = text.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)

      byProduction.get(r.production_id)!.feedback.push({
        id: r.feedback_id,
        author: r.author || 'Cliente',
        comment: text,
        date: r.created_at || undefined,
        is_client: r.is_client ?? true,
        source: r.source || undefined,
      })
    }

    const items = Array.from(byProduction.values())

    // Ordena cada lista de feedback (mais recente primeiro) e a lista de produções
    for (const item of items) {
      item.feedback.sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0
        const db = b.date ? new Date(b.date).getTime() : 0
        return db - da
      })
    }

    items.sort((a, b) => {
      const da = a.feedback[0]?.date ? new Date(a.feedback[0].date).getTime() : 0
      const db = b.feedback[0]?.date ? new Date(b.feedback[0].date).getTime() : 0
      return db - da
    })

    return NextResponse.json({ items })
  } catch (error: any) {
    console.error('[feedback-all] erro inesperado:', error)
    return NextResponse.json({ items: [], error: error.message }, { status: 200 })
  }
}
