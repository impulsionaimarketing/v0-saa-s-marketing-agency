import { getProductions } from '@/lib/data/productions'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const productions = await getProductions()
    return NextResponse.json(productions)
  } catch (error) {
    console.error('Error fetching productions:', error)
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch productions' }), { status: 500 })
  }
}