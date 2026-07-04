import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. Conta arquivos por produção (leitura direta anônima)
  const { data: files, error: fErr } = await supabase
    .from('production_files')
    .select('production_id, url, file_type')

  const counts: Record<string, number> = {}
  for (const f of files ?? []) counts[f.production_id] = (counts[f.production_id] || 0) + 1
  const multi = Object.entries(counts).filter(([, c]) => c > 1)

  // 2. Testa o join embutido igual ao getProductionByToken em uma produção com >1 arquivo
  const targetId = multi[0]?.[0] ?? files?.[0]?.production_id ?? null
  let joinCount: number | null = null
  let joinErr: string | null = null
  if (targetId) {
    const { data: prod, error: pErr } = await supabase
      .from('productions')
      .select('id, production_files(id, url, file_type)')
      .eq('id', targetId)
      .maybeSingle()
    joinErr = pErr?.message ?? null
    joinCount = (prod as any)?.production_files?.length ?? null
  }

  return NextResponse.json({
    totalFiles: files?.length ?? 0,
    filesError: fErr?.message ?? null,
    productionsWithMultiple: multi.length,
    exampleCounts: multi.slice(0, 5),
    targetId,
    joinCount,
    joinErr,
  })
}
