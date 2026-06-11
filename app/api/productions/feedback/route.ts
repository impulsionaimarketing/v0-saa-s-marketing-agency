import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type FeedbackItem = {
  id: string
  author: string
  comment: string
  date?: string
  is_client?: boolean
}

type ProductionInfo = {
  id: string
  title?: string
  notes?: string
  status: string
  type?: string
  client_name?: string
  post_date?: string
  thumbnail_url?: string | null
  thumbnail_is_video?: boolean
}

// Retorna a lista de produções que receberam comentários/alterações do cliente,
// já com os dados da produção (autossuficiente, não depende de outra listagem).
export async function GET() {
  try {
    const supabase = await createClient()

    // Os comentários do cliente são gravados em DUAS tabelas:
    // - production_comments (comentário avulso)
    // - production_approvals (decisão + comentário)
    // Buscamos as duas e mesclamos, deduplicando pelo texto.
    const [commentsRes, approvalsRes] = await Promise.all([
      supabase
        .from('production_comments')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('production_approvals')
        .select('*')
        .order('created_at', { ascending: false }),
    ])

    if (commentsRes.error) {
      console.error('[feedback-all] erro ao buscar comentários:', commentsRes.error)
    }
    if (approvalsRes.error) {
      console.error('[feedback-all] erro ao buscar aprovações:', approvalsRes.error)
    }

    // Normaliza os dois formatos numa lista única de feedback
    const normalized: { production_id: string; item: FeedbackItem }[] = []

    for (const c of commentsRes.data || []) {
      const text = (c.comment as string | null)?.trim()
      if (!c.production_id || !text) continue
      normalized.push({
        production_id: c.production_id,
        item: {
          id: c.id,
          author: c.author_name || 'Cliente',
          comment: text,
          date: c.created_at,
          is_client: c.is_client ?? true,
        },
      })
    }

    for (const a of approvalsRes.data || []) {
      const text = (a.comment as string | null)?.trim()
      // Só interessa quando há um comentário/alteração escrito pelo cliente
      if (!a.production_id || !text) continue
      normalized.push({
        production_id: a.production_id,
        item: {
          id: a.id,
          author: a.approved_by || 'Cliente',
          comment: text,
          date: a.created_at,
          is_client: true,
        },
      })
    }

    if (normalized.length === 0) {
      return NextResponse.json({ items: [] })
    }

    // Agrupa por produção, removendo textos duplicados (mesmo comentário nas 2 tabelas)
    const feedbackByProduction = new Map<string, FeedbackItem[]>()
    const seenByProduction = new Map<string, Set<string>>()

    for (const { production_id, item } of normalized) {
      if (!feedbackByProduction.has(production_id)) {
        feedbackByProduction.set(production_id, [])
        seenByProduction.set(production_id, new Set())
      }
      const seen = seenByProduction.get(production_id)!
      const key = item.comment.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      feedbackByProduction.get(production_id)!.push(item)
    }

    // Ordena os comentários de cada produção pela data mais recente
    for (const list of feedbackByProduction.values()) {
      list.sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0
        const db = b.date ? new Date(b.date).getTime() : 0
        return db - da
      })
    }

    const productionIds = Array.from(feedbackByProduction.keys())

    // Busca os dados das produções correspondentes
    const { data: productions, error: prodError } = await supabase
      .from('productions')
      .select('id, title, notes, status, type, post_date, client_id, clients:client_id (name)')
      .in('id', productionIds)

    if (prodError) {
      console.error('[feedback-all] erro ao buscar produções:', prodError)
    }

    const productionMap = new Map<string, any>()
    for (const p of productions || []) {
      productionMap.set(p.id, p)
    }

    // Busca a primeira mídia de cada produção para a miniatura
    const { data: files } = await supabase
      .from('production_files')
      .select('production_id, url, file_type, uploaded_at')
      .in('production_id', productionIds)
      .order('uploaded_at', { ascending: false })

    const thumbByProduction = new Map<string, { url: string; is_video: boolean }>()
    for (const f of files || []) {
      const pid = f.production_id as string
      if (thumbByProduction.has(pid)) continue
      thumbByProduction.set(pid, {
        url: f.url,
        is_video: (f.file_type as string | null)?.startsWith('video/') ?? false,
      })
    }

    const items = productionIds.map((id) => {
      const p = productionMap.get(id)
      const thumb = thumbByProduction.get(id)
      const production: ProductionInfo = {
        id,
        title: p?.title,
        notes: p?.notes,
        status: p?.status || 'Solicitou Ajuste',
        type: p?.type,
        client_name: p?.clients?.name || undefined,
        post_date: p?.post_date,
        thumbnail_url: thumb?.url || null,
        thumbnail_is_video: thumb?.is_video ?? p?.type === 'Vídeo',
      }
      return {
        production,
        feedback: feedbackByProduction.get(id) || [],
      }
    })

    // Ordena pela alteração mais recente
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
