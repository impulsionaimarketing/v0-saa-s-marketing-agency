## Análise: Variáveis de Ambiente - GitHub vs Supabase

### Situação Encontrada

#### Variáveis Atualmente no GitHub/Vercel (`.env.project`)
```
NEXT_PUBLIC_SUPABASE_URL=https://oohfpxgryppemtqhcbbw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vaGZweGdyeXBwZW10cWhjYmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MjcyMzIsImV4cCI6MjA4ODUwMzIzMn0.IhuKmZIWqNeFCbT0J4VznyEB5P1czaB1qLn9DPQp75Y
```
**Resultado**: Usando Supabase OFICIAL

#### Seu Supabase Autohospedado
```
URL=https://chatwoot-supabase.6gpkjl.easypanel.host/
KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
```

### Ações Necessárias

#### 1. Para usar o Supabase Autohospedado Localmente
Criei o arquivo `.env.local` com as variáveis corretas. Reinicie o servidor:
```bash
pnpm dev
```

#### 2. Para atualizar o GitHub e Vercel
Você precisa atualizando as secrets na Vercel:

1. Acesse: https://vercel.com/projects/prj_6ZcDynDKIzxBTOk6phPEtSPJQTrg/settings/environment-variables
2. Atualize:
   - `NEXT_PUBLIC_SUPABASE_URL` → `https://chatwoot-supabase.6gpkjl.easypanel.host/`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Cole sua chave autohospedada

#### 3. Commit das mudanças
```bash
git add .env.local
git commit -m "feat: configure self-hosted Supabase"
git push origin ocultarmostrar-filtros
```

### Resumo
- ✅ Variáveis locais: CONFIGURADAS com Supabase autohospedado (`.env.local`)
- ⚠️ Variáveis GitHub/Vercel: AINDA apontam para Supabase oficial
- 📝 Necessário: Atualizar secrets na Vercel dashboard
