import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Ordena registros pelo campo de data disponível (created_at ou similar), mais recente primeiro
function sortByDateDesc<T extends Record<string, any>>(rows: T[]): T[] {
  const dateKeys = ['created_at', 'inserted_at', 'changed_at', 'updated_at']
  return [...rows].sort((a, b) => {
    const ka = dateKeys.find((k) => a[k]) 
    const kb = dateKeys.find((k) => b[k])
    const ta = ka ? new Date(a[ka]).getTime() : 0
    const tb = kb ? new Date(b[kb]).getTime() : 0
    return tb - ta
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productionId } = await params
    // Usa a service role key quando disponível para ignorar o RLS na leitura
    // (a tabela permite INSERT anônimo, mas o SELECT anônimo é bloqueado).
    // Faz fallback para a anon key caso a service role não esteja configurada.
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Comentários enviados pelo cliente na página de aprovação
    const { data: comments, error: commentsError } = await supabase
      .from('production_comments')
      .select('*')
      .eq('production_id', productionId)

    if (commentsError) {
      console.error('[feedback] erro ao buscar comentários:', commentsError)
    }

    // Registros de aprovação/reprovação (decisão + comentário)
    const { data: approvals, error: approvalsError } = await supabase
      .from('production_approvals')
      .select('*')
      .eq('production_id', productionId)

    if (approvalsError) {
      console.error('[feedback] erro ao buscar aprovações:', approvalsError)
    }

    return NextResponse.json({
      comments: sortByDateDesc(comments || []),
      approvals: sortByDateDesc(approvals || []),
    })
  } catch (error: any) {
    console.error('[feedback] erro inesperado:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
