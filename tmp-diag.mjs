import { createClient } from '@supabase/supabase-js'
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const { data: files, error: fErr } = await anon
  .from('production_files')
  .select('production_id')
if (fErr) console.log('[diag] ERRO files:', fErr.message)
else {
  const counts = {}
  for (const f of files) counts[f.production_id] = (counts[f.production_id] || 0) + 1
  const multi = Object.entries(counts).filter(([, c]) => c > 1)
  console.log('[diag] Total arquivos:', files.length, '| Produções com >1 arquivo:', multi.length)
  console.log('[diag] Exemplos multi:', multi.slice(0, 5))
}

const multiId = (() => {
  if (!files) return null
  const counts = {}
  for (const f of files) counts[f.production_id] = (counts[f.production_id] || 0) + 1
  const m = Object.entries(counts).find(([, c]) => c > 1)
  return m ? m[0] : (files[0] && files[0].production_id)
})()

if (multiId) {
  const { data: prod, error: pErr } = await anon
    .from('productions')
    .select('id, production_files(id, url, file_type)')
    .eq('id', multiId)
    .maybeSingle()
  if (pErr) console.log('[diag] ERRO join:', pErr.message)
  else console.log('[diag] Join retornou', prod?.production_files?.length, 'arquivos para', multiId)
}
