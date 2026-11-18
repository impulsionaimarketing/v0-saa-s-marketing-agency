import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { executeAction } from '@/lib/agent/tools'

// Executa uma ação que o usuário confirmou no chat do assistente
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { tool, args } = await request.json()
  try {
    const message = await executeAction(user, String(tool), args || {})
    return NextResponse.json({ success: true, message })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: String(error?.message || 'Erro ao executar') }, { status: 400 })
  }
}
