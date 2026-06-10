import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const envKeys = Object.keys(process.env).filter((k) =>
    /supabase|postgres|next_public/i.test(k)
  )

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY

  const result: Record<string, unknown> = {
    envKeys,
    urlPresent: !!url,
    anonPresent: !!anon,
  }

  if (url && anon) {
    try {
      const supabase = createClient(url, anon)
      const { data, error, count } = await supabase
        .from('production_approvals')
        .select('*', { count: 'exact' })
        .limit(10)
      result.error = error
      result.count = count
      result.rows = data
    } catch (e) {
      result.thrown = String(e)
    }
  }

  return NextResponse.json(result)
}
