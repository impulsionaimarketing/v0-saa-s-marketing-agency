// Helper de upload no lado do cliente.
// Envia o arquivo diretamente para uma rota do servidor que faz o upload
// para o MinIO e retorna a URL pública. Substitui o antigo `upload()` do
// pacote @vercel/blob/client.
export async function uploadFile(
  file: File,
  handleUploadUrl: string,
): Promise<{ url: string }> {
  const separator = handleUploadUrl.includes('?') ? '&' : '?'
  const url = `${handleUploadUrl}${separator}filename=${encodeURIComponent(file.name)}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  })

  if (!res.ok) {
    throw new Error('Falha no upload do arquivo')
  }

  const data = (await res.json()) as { url: string }
  return { url: data.url }
}
