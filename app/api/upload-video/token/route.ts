import { NextRequest, NextResponse } from 'next/server'
import { getPresignedUploadUrl } from '@/lib/storage'

export const dynamic = 'force-dynamic'

// Retorna uma URL pré-assinada (presigned PUT) para o cliente enviar o arquivo
// DIRETAMENTE ao MinIO. Assim o arquivo não passa pelo corpo da função
// serverless, evitando o limite de ~4.5MB (erro 413) da Vercel.
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url)
    const productionId = searchParams.get('productionId')
    const filename = searchParams.get('filename')
    const contentType = searchParams.get('contentType') || 'application/octet-stream'

    if (!productionId) {
      return NextResponse.json({ error: 'productionId é obrigatório' }, { status: 400 })
    }

    const { uploadUrl, url } = await getPresignedUploadUrl(
      contentType,
      filename,
      `productions/${productionId}`,
    )

    return NextResponse.json({ uploadUrl, url })
  } catch (error) {
    console.error('[upload/token] Erro:', error)
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
