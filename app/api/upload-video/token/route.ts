import { handleUpload, type HandleUploadBody } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ['image/*', 'video/*'],
          maximumSizeInBytes: 5 * 1024 * 1024 * 1024,
        }
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('[blob] Upload concluído:', blob.url)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 })
  }
}
