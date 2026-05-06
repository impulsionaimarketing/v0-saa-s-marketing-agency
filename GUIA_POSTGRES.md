# Migração PostgreSQL - Guia Prático

## Status Atual

Já migrei **4 arquivos principais** de dados para usar PostgreSQL direto:
- ✅ `lib/data/clients.ts`
- ✅ `lib/data/users.ts`
- ✅ `lib/data/demands.ts`
- ✅ `lib/data/alerts.ts`

O banco de dados `pg` já está instalado e configurado em `lib/db.ts`.

## Passo 1: Criar as Tabelas no PostgreSQL

### Opção A: Usando psql (recomendado)
```bash
psql postgresql://seu-usuario:sua-senha@seu-host:5432/seu-database < scripts/postgres-setup.sql
```

### Opção B: Usando um cliente SQL (pgAdmin, DBeaver, etc.)
1. Copie o conteúdo de `scripts/postgres-setup.sql`
2. Cole no seu cliente SQL
3. Execute

### Opção C: Manualmente
1. Abra seu cliente PostgreSQL
2. Crie os esquemas SQL do arquivo `scripts/postgres-setup.sql`

## Passo 2: Confirmar a Conexão

Teste se a conexão está funcionando fazendo uma requisição simples. No seu terminal do v0, você verá se há erros de conexão.

## Passo 3: Migrar os Arquivos Restantes

Há ainda **~20 arquivos** que usam Supabase e precisam ser migrados. Você pode:

### Opção A: Deixe-me migrar os restantes
Avise-me quais são os mais críticos e faço a migração.

### Opção B: Migre você mesmo seguindo o padrão

**Padrão de Migração**:

```typescript
// ❌ ANTES (com Supabase)
import { createClient } from "@/lib/supabase/server"

export async function getItems(): Promise<Item[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_all_items")
  if (error) throw error
  return data
}

// ✅ DEPOIS (com PostgreSQL)
import { query } from "@/lib/db"

export async function getItems(): Promise<Item[]> {
  return await query<Item>("SELECT * FROM items ORDER BY name")
}
```

## Passo 4: (Opcional) Remover Supabase

Depois que todos os arquivos estiverem migrados:

```bash
npm uninstall @supabase/ssr @supabase/supabase-js
```

E remova os arquivos:
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/proxy.ts`

## Dúvidas Comuns

### P: Onde está meu DATABASE_URL?
R: Está na seção **Vars** do projeto (ícone de engrenagem no canto superior direito)

### P: Como testo se está funcionando?
R: Abra o Console (F12) e verifique se há erros. Você também pode adicionar console.logs na sua aplicação.

### P: Posso manter o Supabase em paralelo?
R: Sim! Você pode manter ambos funcionando enquanto migra. Basta não remover as dependências.

### P: E se eu tiver dados no Supabase?
R: Você precisa migrar os dados também. Faça um export dos dados do Supabase e importe no PostgreSQL:
```bash
# Export de Supabase (via UI)
# Depois import no PostgreSQL
psql seu-database -c "COPY tabela FROM STDIN"
```

## Próximas Ações

1. **Execute o script SQL** - `scripts/postgres-setup.sql`
2. **Verifique os logs** - Console do navegador (F12)
3. **Teste a aplicação** - Navegue por algumas páginas
4. **Me chame se houver problemas** - Posso ajudar a migrar mais arquivos

---

**Tudo pronto para começar!** 🚀
