import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { token, decisions } = await req.json()

    if (!token || !decisions || !Array.isArray(decisions)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    for (const { productionId, decision, comment } of decisions) {
      // Salva aprovação
      await supabase.from('production_approvals').insert({
        production_id: productionId,
        action: decision,
        comment: comment || null,
        approved_by: 'Cliente',
      })

      // Salva comentário se houver
      if (comment?.trim()) {
        await supabase.from('production_comments').insert({
          production_id: productionId,
          author_name: 'Cliente',
          comment: comment.trim(),
          is_client: true,
        })
      }

      // Atualiza status
      const newStatus = decision === 'aprovado' ? 'Aprovado' : 'Solicitou Ajuste'
      await supabase
        .from('productions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', productionId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[bulk-respond]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
