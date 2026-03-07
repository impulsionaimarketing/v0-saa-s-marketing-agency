import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: clientName, taskId } = await params
    const decodedName = decodeURIComponent(clientName)
    const body = await request.json()
    const { completed } = body

    console.log('[v0] Task Update API: Updating demand', taskId, 'for client:', decodedName)

    const supabase = await createClient()

    // Get client ID by name
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .ilike('name', decodedName)
      .single()

    if (clientError || !clientData) {
      console.error('[v0] Task Update API: Client not found:', decodedName)
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    const clientId = clientData.id

    // Update the demand status instead of client_onboarding_tasks
    const { data, error } = await supabase
      .from('demands')
      .update({
        status: completed ? 'Finalizado' : 'A Fazer',
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('client_id', clientId)
      .select()
      .single()

    if (error) {
      console.error('[v0] Task Update API: Error updating demand:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[v0] Task Update API: Demand updated successfully')
    return NextResponse.json({
      id: data.id,
      title: data.name,
      description: data.description,
      completed: data.status === 'Finalizado',
      status: data.status
    })
  } catch (error) {
    console.error('[v0] Task Update API error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar tarefa' }, { status: 500 })
  }
}
