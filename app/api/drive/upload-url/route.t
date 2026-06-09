import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getOrCreateClientFolder } from '@/lib/google-drive'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { fileName, mimeType, fileSize, clientName } = await req.json()

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive'],
    })

    const folderId = await getOrCreateClientFolder(clientName)

    // Gera token de acesso
    const tokenResponse = await auth.getAccessToken()
    const accessToken = tokenResponse.token

    // Cria resumable upload session
    const initRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': mimeType,
          'X-Upload-Content-Length': String(fileSize),
        },
        body: JSON.stringify({
          name: fileName,
          parents: [folderId],
        }),
      }
    )

    const uploadUrl = initRes.headers.get('location')

    if (!uploadUrl) {
      return NextResponse.json({ error: 'Falha ao criar sessão de upload' }, { status: 500 })
    }

    return NextResponse.json({ uploadUrl })
  } catch (error) {
    console.error('[drive/upload-url]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
