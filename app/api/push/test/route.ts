import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth/current-user'
import { sendPushToUserDetailed } from '@/lib/push'

// Envia uma notificação de teste para os aparelhos do próprio usuário
export async function POST() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const result = await sendPushToUserDetailed(userId, {
    title: 'Notificações ativas ✅',
    body: 'Você vai receber aqui as novas tarefas que atribuírem a você.',
    url: '/demandas',
    tag: 'teste',
  })
  return NextResponse.json({ success: result.sent > 0, ...result })
}
