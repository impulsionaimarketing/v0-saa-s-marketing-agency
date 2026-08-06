// Helper de upload no lado do cliente.
// 1) Pede uma URL pré-assinada (presigned PUT) para o servidor.
// 2) Envia o arquivo DIRETAMENTE ao MinIO com essa URL.
// Isso evita o limite de ~4.5MB do corpo das funções serverless (erro 413) e
// permite enviar arquivos grandes (até o limite configurado na UI).
export async function uploadFile(
  file: File,
  handleUploadUrl: string,
): Promise<{ url: string }> {
  const separator = handleUploadUrl.includes('?') ? '&' : '?'
  const contentType = file.type || 'application/octet-stream'
  const presignUrl =
    `${handleUploadUrl}${separator}` +
    `filename=${encodeURIComponent(file.name)}` +
    `&contentType=${encodeURIComponent(contentType)}`

  // 1) Obtém a URL pré-assinada
  const presignRes = await fetch(presignUrl, { method: 'POST' })
  if (!presignRes.ok) {
    throw new Error('Falha ao obter URL de upload')
  }
  const { uploadUrl, url } = (await presignRes.json()) as {
    uploadUrl: string
    url: string
  }

  // 2) Envia o arquivo diretamente ao MinIO
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  })
  if (!putRes.ok) {
    throw new Error('Falha no upload do arquivo')
  }

  return { url }
}
