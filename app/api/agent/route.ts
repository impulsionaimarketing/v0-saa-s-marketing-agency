import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { runTool, toolDefinitions, type PendingAction } from '@/lib/agent/tools'

// Assistente: conversa com o modelo (via OpenRouter) e deixa ele usar as ferramentas do sistema.
export const maxDuration = 60

const MAX_ROUNDS = 6
const MAX_TOOL_CHARS = 7000

const clean = (v?: string) => (v || '').trim().replace(/^["']+|["']+$/g, '').trim()

function systemPrompt(user: { name: string; role: string }) {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Bahia' })
  const weekday = new Date().toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'America/Bahia' })
  const manager = user.role === 'Admin' || user.role === 'Gestor'
  return [
    'Você é o assistente interno da Impulsionaí Marketing, uma agência de marketing. Fala português do Brasil, de forma direta e curta.',
    `Hoje é ${weekday}, ${today}. Quem está falando: ${user.name} (${user.role}).`,
    'Use as ferramentas para consultar dados reais. Nunca invente números, nomes ou prazos; se a ferramenta não trouxer, diga que não encontrou.',
    'Prazos como "sexta" ou "amanhã" você converte para a data AAAA-MM-DD a partir de hoje.',
    manager
      ? 'Para criar demandas ou leads use as ferramentas create_*: elas só PREPARAM a ação e o usuário confirma em um cartão. Depois de chamar, diga que preparou e peça para tocar em Confirmar. Se faltar cliente, área ou nome, pergunte antes.'
      : 'Este usuário é Colaborador: só pode consultar as próprias demandas. Não crie nem altere nada.',
    'Responda em poucas linhas, com listas curtas quando ajudar. Valores em reais (R$). Não use tabelas.',
  ].join('\n')
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const apiKey = clean(process.env.OPENROUTER_API_KEY)
  if (!apiKey) {
    return NextResponse.json(
      { reply: 'O assistente ainda não foi configurado: falta a chave OPENROUTER_API_KEY no servidor.', pending: [] },
      { status: 200 },
    )
  }
  const model = clean(process.env.OPENROUTER_MODEL) || 'anthropic/claude-haiku-5.5'

  const body = await request.json().catch(() => ({}))
  const history = Array.isArray(body.messages) ? body.messages : []

  const messages: any[] = [
    { role: 'system', content: systemPrompt(user) },
    ...history
      .slice(-10)
      .filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string')
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, 2000) })),
  ]
  const tools = toolDefinitions(user)
  const pending: PendingAction[] = []

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dashboard.impulsionaimarketing.com.br',
          'X-Title': 'Impulsionai Assistente',
        },
        body: JSON.stringify({ model, messages, tools, tool_choice: 'auto', max_tokens: 1200, temperature: 0.2 }),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        console.error('[agent] OpenRouter erro', res.status, text.slice(0, 300))
        const hint = res.status === 401 ? 'A chave do OpenRouter foi recusada.' : res.status === 402 ? 'O saldo do OpenRouter acabou.' : 'O serviço de IA não respondeu.'
        return NextResponse.json({ reply: `${hint} (código ${res.status})`, pending: [] })
      }

      const data = await res.json()
      const msg = data?.choices?.[0]?.message
      if (!msg) return NextResponse.json({ reply: 'Não consegui processar sua solicitação.', pending: [] })

      const calls = msg.tool_calls as { id: string; function: { name: string; arguments: string } }[] | undefined
      if (!calls || calls.length === 0) {
        return NextResponse.json({ reply: (msg.content || '').trim() || 'Pronto.', pending })
      }

      messages.push({ role: 'assistant', content: msg.content ?? '', tool_calls: calls })
      for (const call of calls) {
        let args: Record<string, any> = {}
        try { args = JSON.parse(call.function.arguments || '{}') } catch {}
        const result = await runTool(user, call.function.name, args, pending)
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result).slice(0, MAX_TOOL_CHARS),
        })
      }
    }
    return NextResponse.json({ reply: 'A consulta ficou longa demais. Tente perguntar de forma mais específica.', pending })
  } catch (error) {
    console.error('[agent] erro', error)
    return NextResponse.json({ reply: 'Erro ao falar com o assistente. Tente de novo.', pending: [] })
  }
}
