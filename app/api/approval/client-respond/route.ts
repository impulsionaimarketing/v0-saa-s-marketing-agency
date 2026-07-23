import { type NextRequest, NextResponse } from 'next/server'

type ApprovalElement = 'capa' | 'midia' | 'legenda'

const ELEMENT_LABELS: Record<ApprovalElement, string> = {
  capa: 'Capa',
  midia: 'Mídia',
  legenda: 'Legenda',
}

// Resposta de aprovação do cliente vinda do portal único (link por client_id).
// Persiste as decisões por elemento, registra comentários de ajuste e atualiza
// o status geral da produção — mesmo padrão do fluxo por token.
export async function POST(req: NextRequest) {
  try {
    const { clientId, productionId, clientName, elements } = await req.json()

    if (!clientId || !productionId || !Array.isArray(elements) || elements.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // Verifica que a produção realmente pertence a este cliente (segurança do link público).
    const { data: prod, error: prodError } = await supabase
      .from('productions')
      .select('id, client_id')
      .eq('id', productionId)
      .eq('client_id', clientId)
      .maybeSingle()

    if (prodError || !prod) {
      return NextResponse.json({ error: 'Conteúdo não encontrado para este cliente.' }, { status: 404 })
    }

    const author = typeof clientName === 'string' && clientName.trim() ? clientName.trim() : 'Cliente'

    // Uma decisão (linha) por elemento
    const approvalRows = elements.map((el: any) => ({
      production_id: productionId,
      element: el.element,
      action: el.decision,
      comment: el.comment?.trim() || null,
      approved_by: author,
    }))

    const { error: approvalError } = await supabase
      .from('production_approvals')
      .insert(approvalRows)

    if (approvalError) {
      console.error('[client-respond] erro ao salvar aprovação:', approvalError)
      return NextResponse.json({ error: 'Erro ao salvar aprovação.' }, { status: 500 })
    }

    // Comentários de ajuste (com prefixo do elemento) no feed de comentários
    const commentRows = elements
      .filter((el: any) => el.decision === 'reprovado' && el.comment?.trim())
      .map((el: any) => ({
        production_id: productionId,
        author_name: author,
        comment: `[${ELEMENT_LABELS[el.element as ApprovalElement] || el.element}] ${el.comment.trim()}`,
        is_client: true,
      }))

    if (commentRows.length > 0) {
      await supabase.from('production_comments').insert(commentRows)
    }

    // Status geral: Aprovado só se TODOS os elementos foram aprovados
    const allApproved = elements.every((el: any) => el.decision === 'aprovado')
    const newStatus = allApproved ? 'Aprovado' : 'Solicitou Ajuste'

    await supabase
      .from('productions')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', productionId)

    return NextResponse.json({ success: true, allApproved })
  } catch (error) {
    console.error('[client-respond]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
