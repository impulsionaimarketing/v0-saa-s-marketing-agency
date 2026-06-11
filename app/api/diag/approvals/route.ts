import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const allKeys = Object.keys(process.env).sort()
  // Referência literal para forçar o inlining do Next (como em server.ts)
  const inlinedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const inlinedAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return NextResponse.json({
    totalKeys: allKeys.length,
    allKeys,
    inlinedUrlPresent: !!inlinedUrl,
    inlinedAnonPresent: !!inlinedAnon,
  })
}
