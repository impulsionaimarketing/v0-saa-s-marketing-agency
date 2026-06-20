# Como Exportar RPC Functions do Supabase Oficial

## Método 1: Usando Supabase Dashboard (Mais Fácil)

1. Acesse: https://app.supabase.com/projects/oohfpxgryppemtqhcbbw/editor/29
2. Clique em "SQL Editor"
3. Execute esta query:

```sql
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

4. Copie todos os resultados
5. Salve num arquivo `functions.sql`

## Método 2: Usando pg_dump (Via Terminal)

```bash
pg_dump \
  -h db.oohfpxgryppemtqhcbbw.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  --schema=public \
  --schema-only \
  -t '*' \
  --no-owner \
  > rpc-functions.sql
```

Quando pedir senha, use a senha do seu banco Supabase oficial.

## Método 3: Usando Node.js Script

```bash
node scripts/export-rpc-functions.js
```

## Depois de Exportar

1. Acesse seu Supabase autohospedado: https://chatwoot-supabase.6gpkjl.easypanel.host/
2. Vá em SQL Editor
3. Cole o conteúdo do arquivo SQL
4. Execute

Pronto! As RPC functions estarão disponíveis no seu Supabase autohospedado.
