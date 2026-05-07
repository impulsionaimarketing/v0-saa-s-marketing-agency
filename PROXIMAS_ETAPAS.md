Credenciais Supabase Atualizadas com Sucesso!

## Status Atual

As variáveis de ambiente foram atualizadas:
- NEXT_PUBLIC_SUPABASE_URL: https://chatwoot-supabase.6gpkjl.easypanel.host/
- NEXT_PUBLIC_SUPABASE_ANON_KEY: [configurado]

## Próximas Etapas

### 1. Criar as Tabelas no Novo Supabase

Abra o SQL Editor do seu novo Supabase e execute:
- Arquivo: `SCHEMA_SUPABASE.sql`
- Copia todo conteúdo e cola no SQL Editor
- Clica Run

Isso vai criar as 9 tabelas necessárias com todas as colunas corretas.

### 2. Migrar Dados do Supabase Antigo (Opcional)

Se você tem dados no Supabase antigo que quer preservar:

```bash
node scripts/migrate-data.js
```

Isso vai exportar dados de:
- users
- clients
- demands
- productions
- campaigns
- reports
- alerts
- activity_logs
- client_responsibles

### 3. Testar a Conexão

Abra a aplicação no navegador e verifique:
- Se consegue ver dados
- Se consegue criar novos registros
- Abra o Console (F12) para verificar se há erros

### 4. Ativar RLS (Segurança)

Se quiser ativar Row Level Security:
- Descomente as políticas em `SCHEMA_SUPABASE.sql`
- Execute novamente no SQL Editor

## Arquivos Importantes

- `SCHEMA_SUPABASE.sql` - Schema com 9 tabelas
- `scripts/migrate-data.js` - Script de migração
- `MIGRACAO_FINAL.md` - Guia detalhado

Está tudo pronto! 🚀
