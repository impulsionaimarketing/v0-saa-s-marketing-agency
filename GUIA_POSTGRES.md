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

## Passo 2: Migrar os Dados do Supabase

Este é um passo **crítico** se você tem dados no Supabase que precisa preservar.

### Usando o Script de Migração (Automático)

Criei um script que automatiza toda a migração de dados:

```bash
# 1. Certifique-se que DATABASE_URL está configurada
# 2. Certifique-se que as tabelas foram criadas (Passo 1)
# 3. Execute o script
node scripts/migrate-data.js
```

**O que o script faz:**
- Conecta ao Supabase e PostgreSQL
- Exporta dados de: `users`, `clients`, `demands`, `alerts`, `client_responsibles`
- Importa no PostgreSQL mantendo os IDs originais
- Usa `ON CONFLICT DO NOTHING` para evitar duplicatas

**Importante:** O script requer as variáveis de ambiente:
- `DATABASE_URL` - PostgreSQL destino
- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço (não use a chave anon!)

### Exportação Manual (Alternativa)

Se preferir fazer manualmente:

1. **No Supabase:**
   - Vá para SQL Editor
   - Execute queries para cada tabela:
   ```sql
   SELECT * FROM users;
   SELECT * FROM clients;
   SELECT * FROM demands;
   SELECT * FROM alerts;
   SELECT * FROM client_responsibles;
   ```
   - Copie os resultados (clique em "Download as CSV" ou "Copy")

2. **No PostgreSQL:**
   - Use COPY para importar:
   ```sql
   \COPY users FROM 'users.csv' WITH CSV HEADER;
   \COPY clients FROM 'clients.csv' WITH CSV HEADER;
   -- etc...
   ```

### Verificar a Migração

Após executar o script, verifique:

```bash
# Conecte ao PostgreSQL e execute:
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM clients;
SELECT COUNT(*) FROM demands;
SELECT COUNT(*) FROM alerts;
```

Compare os números com o Supabase para garantir que tudo foi migrado.

## Passo 3: Confirmar a Conexão

Teste se a conexão está funcionando fazendo uma requisição simples. No seu terminal do v0, você verá se há erros de conexão.

## Passo 4: Migrar os Arquivos Restantes

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

## Passo 5: (Opcional) Remover Supabase

Depois que todos os arquivos estiverem migrados e você confirmar que tudo funciona:

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
R: Use o script `scripts/migrate-data.js` para migrar automaticamente!

### P: O script de migração está dando erro. O que fazer?
R: Verifique:
1. DATABASE_URL está no `.env.local` ou configurada nas Vars
2. SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão corretos
3. As tabelas foram criadas com `scripts/postgres-setup.sql`
4. O PostgreSQL está acessível e com conexão ativa

## Próximas Ações

1. **Execute o script SQL** - `scripts/postgres-setup.sql`
2. **Migre os dados** - `node scripts/migrate-data.js` (se tiver dados no Supabase)
3. **Verifique os logs** - Console do navegador (F12)
4. **Teste a aplicação** - Navegue por algumas páginas
5. **Me chame se houver problemas** - Posso ajudar a migrar mais arquivos

---

**Tudo pronto para começar!** 🚀

