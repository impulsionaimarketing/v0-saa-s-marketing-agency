import { query, queryOne } from '@/lib/db'
import { NextResponse } from 'next/server'

interface Client {
  id: string
  name: string
  monthly_value: number
  contract_status: 'Ativo' | 'Pausado' | 'Perdido'
  ad_account_name: string | null
}

export async function GET() {
  try {
    // Busca clientes com contrato ativo ou pausado para exibir no CRM
    const clients = await query<Client>(
      `SELECT id, name, monthly_value, contract_status, ad_account_name
       FROM clients 
       WHERE contract_status IN ('Ativo', 'Pausado')
       ORDER BY name`
    )

    return NextResponse.json(clients || [])
  } catch (error) {
    console.error('[v0] Error fetching clients for CRM:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}
