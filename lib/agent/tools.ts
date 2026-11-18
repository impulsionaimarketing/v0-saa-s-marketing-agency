import { getDemands, createDemand } from '@/lib/data/demands'
import { getClients } from '@/lib/data/clients'
import { getUsers } from '@/lib/data/users'
import { getProductions } from '@/lib/data/productions'
import { getCRMLeads, createCRMLead } from '@/lib/data/crm-leads'
import { getClientMetrics, type PlatformFilter } from '@/lib/data/meta-ads-hierarchical'
import { CRM_SERVICES } from '@/lib/data/crm-config'

// Ferramentas do assistente. Consultas executam direto; criações só PREPARAM uma ação,
// que o usuário confirma no chat (executeAction roda depois do toque em "Confirmar").

export interface AgentUser {
  id: string
  name: string
  role: string
}

export interface PendingAction {
  id: string
  tool: 'create_demand' | 'create_lead'
  args: Record<string, any>
  summary: string[]
}

const norm = (s: unknown) =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const isManager = (u: AgentUser) => u.role === 'Admin' || u.role === 'Gestor'

// Acha por nome sem acento e sem diferenciar maiúsculas; avisa se for ambíguo
function findByName<T extends { name: string }>(items: T[], query: string): { item?: T; error?: string } {
  const q = norm(query)
  if (!q) return { error: 'nome vazio' }
  const exact = items.filter((i) => norm(i.name) === q)
  if (exact.length === 1) return { item: exact[0] }
  const partial = items.filter((i) => norm(i.name).includes(q) || q.includes(norm(i.name)))
  if (partial.length === 1) return { item: partial[0] }
  if (partial.length > 1) return { error: `"${query}" é ambíguo: ${partial.slice(0, 5).map((i) => i.name).join(', ')}` }
  return { error: `não encontrei "${query}"` }
}

const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Bahia' })

// ---------------------------------------------------------------- definições (formato OpenAI/OpenRouter)
const fn = (name: string, description: string, properties: Record<string, any>, required: string[] = []) => ({
  type: 'function' as const,
  function: { name, description, parameters: { type: 'object', properties, required } },
})

export function toolDefinitions(user: AgentUser) {
  const read = [
    fn('list_demands', 'Lista demandas (tarefas do dia a dia). Use para perguntas sobre o que está pendente, atrasado, de quem é, etc.', {
      status: { type: 'string', enum: ['A Fazer', 'Em Produção', 'Publicado'], description: 'A Fazer, Em Produção (=Fazendo) ou Publicado (=Feito)' },
      responsible_name: { type: 'string', description: 'Nome do responsável (parcial serve)' },
      client_name: { type: 'string', description: 'Nome do cliente (parcial serve)' },
      only_late: { type: 'boolean', description: 'Só as atrasadas (prazo vencido e não feitas)' },
    }),
  ]
  if (!isManager(user)) return read

  return [
    ...read,
    fn('list_clients', 'Lista clientes com status do contrato, plano e valor mensal.', {
      status: { type: 'string', enum: ['Ativo', 'Pausado', 'Perdido'] },
    }),
    fn('list_users', 'Lista os colaboradores (nome, perfil e área).', {}),
    fn('list_productions', 'Lista conteúdos da Produção (vídeos e artes) e a etapa em que estão.', {
      client_name: { type: 'string' },
      status: { type: 'string', description: 'Etapa: Planejamento, Aprovação da Ideia, Captação, Edição, Aprovação do Cliente, Solicitou Ajuste, Programado, Publicado' },
    }),
    fn('list_leads', 'Lista leads do CRM.', {
      status: { type: 'string', enum: ['lead_novo', 'entrar_em_contato', 'proposta_enviada', 'contrato_ativo', 'contrato_pausado', 'contrato_cancelado'] },
    }),
    fn('ads_summary', 'Resumo de tráfego pago (Meta e Google) por cliente em um período: investimento, resultados e custo por resultado.', {
      start_date: { type: 'string', description: 'AAAA-MM-DD' },
      end_date: { type: 'string', description: 'AAAA-MM-DD' },
      client_name: { type: 'string', description: 'Opcional: só este cliente' },
      platform: { type: 'string', enum: ['meta', 'google', 'all'] },
    }, ['start_date', 'end_date']),
    fn('create_demand', 'PREPARA a criação de uma demanda; o usuário confirma antes de gravar.', {
      name: { type: 'string', description: 'Título da demanda' },
      client_name: { type: 'string' },
      area: { type: 'string', enum: ['Arte', 'Vídeo', 'Tráfego', 'Comunicação'] },
      responsible_name: { type: 'string', description: 'Quem vai fazer (recebe aviso no celular)' },
      deadline: { type: 'string', description: 'AAAA-MM-DD' },
      description: { type: 'string' },
      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    }, ['name', 'client_name', 'area']),
    fn('create_lead', 'PREPARA a criação de um lead no CRM; o usuário confirma antes de gravar.', {
      name: { type: 'string' },
      phone: { type: 'string' },
      company: { type: 'string' },
      services: { type: 'array', items: { type: 'string', enum: [...CRM_SERVICES] } },
      proposal_value: { type: 'number' },
      notes: { type: 'string' },
    }, ['name']),
  ]
}

// ---------------------------------------------------------------- execução
const clip = (rows: any[], max = 30) => ({ total: rows.length, showing: Math.min(rows.length, max), rows: rows.slice(0, max) })

export async function runTool(
  user: AgentUser,
  name: string,
  args: Record<string, any>,
  pending: PendingAction[],
): Promise<unknown> {
  try {
    switch (name) {
      case 'list_demands': {
        let demands = await getDemands({ current_user_id: user.id, current_user_role: user.role })
        const limit = today()
        if (args.status) demands = demands.filter((d) => d.status === args.status)
        if (args.responsible_name) demands = demands.filter((d) => norm(d.responsible_name).includes(norm(args.responsible_name)))
        if (args.client_name) demands = demands.filter((d) => norm(d.client_name).includes(norm(args.client_name)))
        if (args.only_late) demands = demands.filter((d) => d.deadline && d.deadline.slice(0, 10) < limit && d.status !== 'Publicado')
        return clip(
          demands.map((d) => ({
            demanda: d.name, cliente: d.client_name, area: d.area, responsavel: d.responsible_name,
            prazo: d.deadline?.slice(0, 10) ?? null,
            status: d.status === 'Em Produção' ? 'Fazendo' : d.status === 'Publicado' ? 'Feito' : d.status,
          })),
        )
      }

      case 'list_clients': {
        if (!isManager(user)) return { error: 'sem permissão' }
        const clients = await getClients({ status: args.status })
        return clip(clients.map((c) => ({
          cliente: c.name, contrato: c.contract_status, plano: c.plan, valor_mensal: c.monthly_value, campanha: c.campaign_type,
        })))
      }

      case 'list_users': {
        if (!isManager(user)) return { error: 'sem permissão' }
        const users = await getUsers({ status: 'Ativo' })
        return clip(users.map((u) => ({ nome: u.name, perfil: u.role, area: u.area })))
      }

      case 'list_productions': {
        if (!isManager(user)) return { error: 'sem permissão' }
        let rows = await getProductions({ current_user_id: user.id, current_user_role: user.role })
        if (args.client_name) rows = rows.filter((p) => norm(p.client_name).includes(norm(args.client_name)))
        if (args.status) rows = rows.filter((p) => norm(p.status) === norm(args.status))
        return clip(rows.map((p) => ({
          conteudo: p.title || p.notes, tipo: p.type, cliente: p.client_name, etapa: p.status,
          responsavel: p.responsible_name, data_postagem: p.post_date?.slice(0, 10) ?? null,
        })))
      }

      case 'list_leads': {
        if (!isManager(user)) return { error: 'sem permissão' }
        const leads = await getCRMLeads({ status: args.status })
        return clip(leads.map((l) => ({
          nome: l.name, empresa: l.company, telefone: l.phone, status: l.status, valor_proposta: l.proposal_value, servicos: l.services,
        })))
      }

      case 'ads_summary': {
        if (!isManager(user)) return { error: 'sem permissão' }
        const platform = (['meta', 'google'].includes(args.platform) ? args.platform : 'all') as PlatformFilter
        let rows = await getClientMetrics(args.start_date, args.end_date, platform)
        if (args.client_name) rows = rows.filter((r) => norm(r.client_name).includes(norm(args.client_name)))
        return clip(rows.map((r) => ({
          cliente: r.client_name, investimento: Number(r.total_spend.toFixed(2)), resultados: r.total_results,
          tipo_resultado: r.result_type, custo_por_resultado: Number(r.cost_per_result.toFixed(2)),
          impressoes: r.total_impressions, cliques: r.total_clicks,
        })))
      }

      case 'create_demand': {
        if (!isManager(user)) return { error: 'sem permissão para criar demandas' }
        const clients = await getClients({ status: 'Ativo' })
        const client = findByName(clients, args.client_name)
        if (!client.item) return { error: `cliente: ${client.error}` }

        let responsible: { id: string; name: string } | undefined
        if (args.responsible_name) {
          const users = await getUsers({ status: 'Ativo' })
          const found = findByName(users, args.responsible_name)
          if (!found.item) return { error: `responsável: ${found.error}` }
          responsible = found.item
        }
        if (args.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(args.deadline)) return { error: 'prazo deve estar no formato AAAA-MM-DD' }

        const action: PendingAction = {
          id: crypto.randomUUID(),
          tool: 'create_demand',
          args: {
            name: String(args.name).slice(0, 200),
            client_id: client.item.id,
            area: args.area,
            responsible_id: responsible?.id ?? null,
            deadline: args.deadline ?? null,
            description: args.description ?? null,
            priority: args.priority ?? 'medium',
          },
          summary: [
            `Demanda: ${args.name}`,
            `Cliente: ${client.item.name}`,
            `Área: ${args.area}`,
            `Responsável: ${responsible?.name ?? 'sem responsável'}`,
            `Prazo: ${args.deadline ? args.deadline.split('-').reverse().join('/') : 'sem prazo'}`,
          ],
        }
        pending.push(action)
        return { status: 'aguardando_confirmacao', mensagem: 'Ação preparada. O usuário vai confirmar no chat; não diga que já foi criada.' }
      }

      case 'create_lead': {
        if (!isManager(user)) return { error: 'sem permissão para criar leads' }
        const action: PendingAction = {
          id: crypto.randomUUID(),
          tool: 'create_lead',
          args: {
            name: String(args.name).slice(0, 200),
            phone: args.phone ?? null,
            company: args.company ?? null,
            services: Array.isArray(args.services) ? args.services : [],
            proposal_value: Number(args.proposal_value) || 0,
            notes: args.notes ?? null,
          },
          summary: [
            `Lead: ${args.name}`,
            ...(args.company ? [`Empresa: ${args.company}`] : []),
            ...(args.phone ? [`Telefone: ${args.phone}`] : []),
            ...(Array.isArray(args.services) && args.services.length ? [`Serviços: ${args.services.join(', ')}`] : []),
            ...(args.proposal_value ? [`Valor da proposta: R$ ${Number(args.proposal_value).toLocaleString('pt-BR')}`] : []),
          ],
        }
        pending.push(action)
        return { status: 'aguardando_confirmacao', mensagem: 'Ação preparada. O usuário vai confirmar no chat; não diga que já foi criada.' }
      }

      default:
        return { error: `ferramenta desconhecida: ${name}` }
    }
  } catch (error: any) {
    console.error('[agent] erro na ferramenta', name, error)
    return { error: String(error?.message || error).slice(0, 200) }
  }
}

// Executa a ação já confirmada pelo usuário
export async function executeAction(user: AgentUser, tool: string, args: Record<string, any>): Promise<string> {
  if (!isManager(user)) throw new Error('Sem permissão.')

  if (tool === 'create_demand') {
    if (!args.name || !args.client_id || !['Arte', 'Vídeo', 'Tráfego', 'Comunicação'].includes(args.area)) {
      throw new Error('Dados da demanda incompletos.')
    }
    await createDemand({
      name: args.name,
      client_id: args.client_id,
      area: args.area,
      responsible_id: args.responsible_id || null,
      deadline: args.deadline || null,
      description: args.description || null,
      priority: args.priority || 'medium',
      status: 'A Fazer',
    })
    return args.responsible_id ? 'Demanda criada e o responsável foi avisado no celular.' : 'Demanda criada.'
  }

  if (tool === 'create_lead') {
    if (!args.name) throw new Error('Dados do lead incompletos.')
    await createCRMLead({
      name: args.name,
      phone: args.phone || null,
      company: args.company || null,
      services: Array.isArray(args.services) ? args.services : [],
      proposal_value: Number(args.proposal_value) || 0,
      notes: args.notes || null,
      source: 'Assistente',
    })
    return 'Lead criado no CRM.'
  }

  throw new Error('Ação desconhecida.')
}
