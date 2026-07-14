import { NextRequest, NextResponse } from 'next/server'
import { uploadToStorage } from '@/lib/storage'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Recebe o arquivo diretamente do cliente e faz o upload para o MinIO,
// retornando a URL pública. Substitui o antigo fluxo de token do @vercel/blob.
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url)
    const productionId = searchParams.get('productionId')
    const filename = searchParams.get('filename')

    if (!productionId) {
      return NextResponse.json({ error: 'productionId é obrigatório' }, { status: 400 })
    }

    if (!req.body) {
      return NextResponse.json({ error: 'arquivo ausente' }, { status: 400 })
    }

    const contentType = req.headers.get('content-type') || 'application/octet-stream'
    const body = Buffer.from(await req.arrayBuffer())

    const { url } = await uploadToStorage(body, contentType, filename, `productions/${productionId}`)

    return NextResponse.json({ url })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
