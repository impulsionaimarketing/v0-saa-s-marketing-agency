import { type NextRequest, NextResponse } from 'next/server'
import { sendWebhookNotification } from '@/lib/webhooks/send-notification'

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

      // ─── Notificações (painel + webhook) ──────────────────────────────────
      const { data: production } = await supabase
        .from('productions')
        .select('id, title, client_id')
        .eq('id', productionId)
        .single()

      const productionTitle = production?.title || 'Produção'

      if (decision === 'reprovado') {
        try {
          await supabase.from('alerts').insert({
            type: 'late_task',
            title: 'Ajuste solicitado pelo cliente',
            description: `O cliente solicitou ajustes em "${productionTitle}".${
              comment?.trim() ? ` Comentário: ${comment.trim()}` : ''
            }`,
            severity: 'high',
            client_id: production?.client_id || null,
            related_entity_type: 'production',
            related_entity_id: productionId,
          })
        } catch (alertError) {
          console.error('[bulk-respond] Erro ao criar alerta:', alertError)
        }
      }

      await sendWebhookNotification(
        decision === 'aprovado' ? 'approval.approved' : 'approval.adjustment_requested',
        {
          production_id: productionId,
          production_title: productionTitle,
          client_id: production?.client_id || null,
          client_name: 'Cliente',
          decision,
          status: newStatus,
          comment: comment?.trim() || null,
        },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[bulk-respond]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
