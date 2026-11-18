import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth/current-user'

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { endpoint } = await request.json()
  if (!endpoint) return NextResponse.json({ error: 'Endpoint obrigatório' }, { status: 400 })

  const supabase = await createClient()
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', userId)
  return NextResponse.json({ success: true })
}
