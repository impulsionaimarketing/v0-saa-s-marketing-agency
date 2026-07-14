import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const endpoint = process.env.MINIO_ENDPOINT
const bucket = process.env.MINIO_BUCKET

export const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: process.env.MINIO_REGION || 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || '',
    secretAccessKey: process.env.MINIO_SECRET_KEY || '',
  },
})

/** Extracts the file extension (including the dot) from a filename, or "" if none. */
function getExtension(originalName?: string | null): string {
  if (!originalName) return ''
  const idx = originalName.lastIndexOf('.')
  if (idx <= 0 || idx === originalName.length - 1) return ''
  return originalName.slice(idx)
}

/**
 * Uploads a file to the MinIO (S3-compatible) bucket.
 * Generates a unique filename with crypto.randomUUID() while preserving the
 * original file extension and Content-Type, and returns the public URL.
 */
export async function uploadToStorage(
  body: Buffer | Uint8Array,
  contentType: string,
  originalName?: string | null,
  prefix?: string,
): Promise<{ url: string; key: string }> {
  const extension = getExtension(originalName)
  const filename = `${prefix ? `${prefix.replace(/\/$/, '')}/` : ''}${crypto.randomUUID()}${extension}`

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: body,
      ContentType: contentType || 'application/octet-stream',
    }),
  )

  const url = `${endpoint}/${bucket}/${filename}`
  return { url, key: filename }
}

/** Deletes an object from the MinIO bucket given its public URL. */
export async function deleteFromStorage(url: string): Promise<void> {
  const prefix = `${endpoint}/${bucket}/`
  const key = url.startsWith(prefix) ? url.slice(prefix.length) : url

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  )
}
