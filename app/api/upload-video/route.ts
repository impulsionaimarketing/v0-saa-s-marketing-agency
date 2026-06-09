import { handleUpload, type HandleUploadBody } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ['video/*', 'image/*'],
          maximumSizeInBytes: 5 * 1024 * 1024 * 1024, // 5GB
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const { productionId } = JSON.parse(tokenPayload || '{}')
          if (!productionId) return

          const supabase = await createClient()
          await supabase.from('production_files').insert({
            production_id: productionId,
            filename: blob.pathname,
            url: blob.url,
            file_size: 0,
            file_type: blob.contentType,
            uploaded_by: 'dashboard',
          })
        } catch (error) {
          console.error('[upload] Erro ao salvar no Supabase:', error)
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
