import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientName } = await params
    const decodedName = decodeURIComponent(clientName)
    
    console.log('[v0] Onboarding API: Fetching onboarding tasks for client:', decodedName)
    
    const supabase = await createClient()

    // First, get the client ID by name
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .ilike('name', decodedName)
      .single()

    if (clientError || !clientData) {
      console.error('[v0] Onboarding API: Client not found:', decodedName)
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    const clientId = clientData.id

    // Now fetch onboarding demands for this client (demands with description containing '[ONBOARDING]')
    const { data, error } = await supabase
      .from('demands')
      .select('id, name, description, client_id, area, deadline, status, priority, created_at, updated_at')
      .eq('client_id', clientId)
      .like('description', '%ONBOARDING%')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[v0] Onboarding API: Error fetching demands:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[v0] Onboarding API: Found', data?.length || 0, 'onboarding tasks')
    return NextResponse.json({ 
      client: clientData, 
      tasks: (data || []).map((demand: any) => ({
        id: demand.id,
        title: demand.name,
        description: demand.description,
        completed: demand.status === 'Finalizado' || demand.status === 'Publicado',
        completed_at: null,
        order: 0,
        demand_id: demand.id,
        status: demand.status,
        priority: demand.priority
      }))
    })
  } catch (error) {
    console.error('[v0] Onboarding API error:', error)
    return NextResponse.json({ error: 'Erro ao buscar tarefas' }, { status: 500 })
  }
}
