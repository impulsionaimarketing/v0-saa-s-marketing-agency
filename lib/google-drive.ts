import { google } from 'googleapis'

function getAuthClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  return auth
}

export async function getOrCreateClientFolder(clientName: string): Promise<string> {
  const auth = getAuthClient()
  const drive = google.drive({ version: 'v3', auth })
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!

  // Verifica se já existe pasta com o nome do cliente
  const { data } = await drive.files.list({
    q: `'${rootFolderId}' in parents and name = '${clientName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
  })

  if (data.files && data.files.length > 0) {
    return data.files[0].id!
  }

  // Cria a pasta do cliente
  const { data: folder } = await drive.files.create({
    requestBody: {
      name: clientName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolderId],
    },
    fields: 'id',
  })

  return folder.id!
}

export async function uploadFileToDrive(params: {
  fileName: string
  mimeType: string
  buffer: Buffer
  folderId: string
}): Promise<{ id: string; url: string }> {
  const auth = getAuthClient()
  const drive = google.drive({ version: 'v3', auth })

  const { Readable } = await import('stream')
  const stream = Readable.from(params.buffer)

  const { data: file } = await drive.files.create({
    requestBody: {
      name: params.fileName,
      parents: [params.folderId],
    },
    media: {
      mimeType: params.mimeType,
      body: stream,
    },
    fields: 'id, webViewLink, webContentLink',
  })

  // Torna o arquivo público
  await drive.permissions.create({
    fileId: file.id!,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  })

  // URL direta para visualização
  const url = `https://drive.google.com/file/d/${file.id}/view`

  return { id: file.id!, url }
}
