# Migração de Supabase para PostgreSQL - Status

## Completado ✅

### Arquivos Migrados (4):
1. **lib/data/clients.ts** - Migrado para SQL direto com `pg`
2. **lib/data/users.ts** - Migrado para SQL direto com `pg`
3. **lib/data/demands.ts** - Migrado para SQL direto com `pg`
4. **lib/data/alerts.ts** - Migrado para SQL direto com `pg`

### Configuração Realizada:
- `DATABASE_URL` configurada no projeto
- `lib/db.ts` já estava pronto com helper functions (`query`, `queryOne`, `execute`)
- Schema PostgreSQL está disponível em `scripts/supabase-setup.sql`

## Próximas Etapas

### 1. Executar o Schema SQL
Execute o script SQL no seu PostgreSQL:

```bash
psql postgresql://usuario:senha@host:porta/database < scripts/supabase-setup.sql
```

Ou copie e execute o conteúdo de `scripts/supabase-setup.sql` diretamente no seu cliente PostgreSQL.

### 2. Arquivos Ainda Usando Supabase (requerem migração):

**Data Layer (lib/data/)**:
- `productions.ts` - Migrar RPC calls para SQL direto
- `payments.ts` - Migrar RPC calls e `.from()` para SQL direto
- `monthly-plannings.ts` - Verificar e migrar se necessário
- `meta-ads.ts` - Verificar e migrar se necessário
- `meta-ads-hierarchical.ts` - Verificar e migrar se necessário
- `production-files.ts` - Verificar e migrar se necessário
- `video-scripts.ts` - Verificar e migrar se necessário
- `get-client.ts` - Verificar e migrar se necessário
- `client-details.ts` - Verificar e migrar se necessário
- `dashboard.ts` - Verificar e migrar se necessário
- `dashboard-views.ts` - Verificar e migrar se necessário
- `crm-leads.ts` - Verificar e migrar se necessário
- `arte-briefs.ts` - Verificar e migrar se necessário

**Auth & Hooks (lib/)**:
- `lib/auth/user-management.ts`
- `lib/hooks/use-permissions.ts`
- `lib/hooks/use-module-access.ts`
- `lib/contexts/auth-context.tsx`

**API Routes (app/api/)**:
- `app/api/clients/**/*.ts`
- `app/api/demands/**/*.ts`
- `app/api/demands-by-area/route.ts`

**Pages & Components**:
- `app/auth/login/page.tsx`
- `app/configuracoes/page.tsx`
- `app/cobrancas/actions.ts`
- `components/clients/client-form-dialog.tsx`

### 3. Remove Supabase Dependencies
Após migrar todos os arquivos, você pode remover:

```bash
npm uninstall @supabase/ssr @supabase/supabase-js
```

E remover/atualizar os arquivos:
- `lib/supabase/client.ts` - Remover
- `lib/supabase/server.ts` - Remover
- `lib/supabase/proxy.ts` - Remover

### 4. Remover Variáveis de Ambiente Supabase
Remova do `.env.local` e das configurações do projeto:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Padrão de Migração

Para migrar cada arquivo, siga este padrão:

### Antes (com Supabase RPC):
```typescript
const supabase = await createClient()
const { data, error } = await supabase.rpc("get_all_items")
```

### Depois (com PostgreSQL direto):
```typescript
import { query, queryOne, execute } from "@/lib/db"

const items = await query<Item>(
  "SELECT * FROM items ORDER BY name"
)
```

## Queries Comuns

### SELECT com WHERE
```typescript
const items = await query<Item>(
  "SELECT * FROM items WHERE status = $1 ORDER BY name",
  ["ativo"]
)
```

### SELECT um item
```typescript
const item = await queryOne<Item>(
  "SELECT * FROM items WHERE id = $1",
  [itemId]
)
```

### INSERT com RETURNING
```typescript
const newItem = await queryOne<Item>(
  "INSERT INTO items (name, status) VALUES ($1, $2) RETURNING *",
  [name, "ativo"]
)
```

### UPDATE com múltiplos campos
```typescript
const updated = await queryOne<Item>(
  `UPDATE items SET name = $1, status = $2, updated_at = NOW() 
   WHERE id = $3 RETURNING *`,
  [newName, newStatus, itemId]
)
```

### DELETE
```typescript
await execute("DELETE FROM items WHERE id = $1", [itemId])
```

## Testes Recomendados

1. Testar as 4 data layers migradas:
   - getClients(), createClient(), updateClient(), deleteClient()
   - getUsers(), createUser(), updateUser(), deleteUser()
   - getDemands(), createDemand(), updateDemand(), deleteDemand()
   - getAlerts(), createAlert(), deleteAlert()

2. Testar as páginas e componentes que usam essas funções

3. Verificar se os webhooks ainda funcionam corretamente

## Notas Importantes

- O arquivo `lib/db.ts` já está totalmente funcional
- O pooling de conexões está configurado automaticamente
- SSL é automaticamente habilitado para URLs remotas
- Todas as queries usam prepared statements (parameterized) para segurança
- Timestamps são automáticos com `DEFAULT NOW()` e `NOW()`

---

**Status**: Em andamento  
**Última atualização**: 2026-05-05
