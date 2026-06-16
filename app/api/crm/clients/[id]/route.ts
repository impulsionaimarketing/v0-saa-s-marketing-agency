import { queryOne } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface Client {
  id: string
  name: string
  monthly_value: number
  contract_status: 'Ativo' | 'Pausado' | 'Perdido'
  ad_account_name: string | null
}

// Atualizar status do contrato do cliente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Mapear status do CRM para status do cliente
    const crmToClientStatus: Record<string, 'Ativo' | 'Pausado' | 'Perdido'> = {
      'contrato_ativo': 'Ativo',
      'contrato_pausado': 'Pausado',
      'contrato_cancelado': 'Perdido',
    }

    const newStatus = crmToClientStatus[body.status]

    if (!newStatus) {
      return NextResponse.json(
        { error: 'Invalid status for client. Clients can only be moved to contract columns.' },
        { status: 400 }
      )
    }

    const client = await queryOne<Client>(
      `UPDATE clients 
       SET contract_status = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [newStatus, id]
    )

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('[v0] Error updating client status:', error)
    return NextResponse.json(
      { error: 'Failed to update client status' },
      { status: 500 }
    )
  }
}
