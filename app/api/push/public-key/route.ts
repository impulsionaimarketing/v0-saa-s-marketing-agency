import { NextResponse } from 'next/server'

// Devolve a chave pública do push lida do servidor (não do build) e informa se ela é válida.
// Uma chave P-256 pública válida tem 65 bytes e começa com 0x04.
export const dynamic = 'force-dynamic'

export async function GET() {
  const key = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim().replace(/^["']+|["']+$/g, '').trim()
  let bytes = 0
  let first = -1
  try {
    const buf = Buffer.from(key.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
    bytes = buf.length
    first = buf[0] ?? -1
  } catch {}
  const valid = /^[A-Za-z0-9_-]+$/.test(key) && bytes === 65 && first === 4
  return NextResponse.json(
    { key: valid ? key : null, valid, bytes, chars: key.length },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
