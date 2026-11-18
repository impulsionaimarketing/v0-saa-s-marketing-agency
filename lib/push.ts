import { setVapidDetails, sendNotification } from 'web-push'
import { createClient } from '@/lib/supabase/server'

// Envio de notificações push (Web Push / VAPID). Módulo só de servidor:
// não é "use server" de propósito, para não virar uma ação chamável pelo navegador.

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

let configured = false

// Remove aspas e espaços que costumam vir junto ao colar a variável na Vercel
const clean = (value?: string) => (value || '').trim().replace(/^["']+|["']+$/g, '').trim()

function configure(): boolean {
  const publicKey = clean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
  const privateKey = clean(process.env.VAPID_PRIVATE_KEY)
  if (!publicKey || !privateKey) {
    console.warn('[push] Chaves VAPID não configuradas; notificações desativadas.')
    return false
  }
  if (!configured) {
    setVapidDetails(clean(process.env.VAPID_SUBJECT) || 'https://impulsionaimarketing.com.br', publicKey, privateKey)
    configured = true
  }
  return true
}

// Envia para todos os aparelhos do usuário; remove os que expiraram
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  try {
    if (!configure()) return 0
    const supabase = await createClient()
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', userId)
    if (error || !subs || subs.length === 0) return 0

    let sent = 0
    await Promise.all(
      subs.map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
        try {
          await sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload),
          )
          sent++
        } catch (e: any) {
          // 404/410: o aparelho cancelou ou desinstalou o app
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', s.id)
          } else {
            console.error('[push] Erro ao enviar:', e?.statusCode, e?.body || e?.message)
          }
        }
      }),
    )
    return sent
  } catch (error) {
    console.error('[push] Erro geral:', error)
    return 0
  }
}

// Aviso de tarefa atribuída a um colaborador
export async function notifyDemandAssigned(demand: {
  id: string
  name: string
  client_id?: string | null
  responsible_id?: string | null
  deadline?: string | null
}): Promise<void> {
  if (!demand.responsible_id) return
  try {
    let clientName = ''
    if (demand.client_id) {
      const supabase = await createClient()
      const { data } = await supabase.from('clients').select('name').eq('id', demand.client_id).maybeSingle()
      clientName = data?.name || ''
    }
    const parts = [clientName]
    if (demand.deadline) {
      const [y, m, d] = String(demand.deadline).slice(0, 10).split('-')
      if (y && m && d) parts.push(`prazo ${d}/${m}`)
    }
    await sendPushToUser(demand.responsible_id, {
      title: 'Nova tarefa',
      body: [demand.name, parts.filter(Boolean).join(' · ')].filter(Boolean).join('\n'),
      url: '/demandas',
      tag: `demanda-${demand.id}`,
    })
  } catch (error) {
    console.error('[push] Erro ao avisar tarefa:', error)
  }
}
