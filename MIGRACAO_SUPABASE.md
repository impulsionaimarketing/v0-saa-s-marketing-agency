# Migração de PostgreSQL para Supabase - Resumo

Este documento descreve a migração completa do projeto de PostgreSQL direto para usar **apenas Supabase** como banco de dados.

## Mudanças Realizadas

### 1. Arquivos de Dados Convertidos para Supabase

Os seguintes arquivos foram convertidos para usar a SDK do Supabase (`@supabase/supabase-js`) em vez de conexões diretas com PostgreSQL:

- **`lib/data/users.ts`** - Gerenciamento de usuários
- **`lib/data/clients.ts`** - Gerenciamento de clientes
- **`lib/data/alerts.ts`** - Sistema de alertas
- **`lib/data/demands.ts`** - Gerenciamento de demandas

Já estavam usando Supabase:
- `lib/data/payments.ts`
- `lib/data/productions.ts`
- `lib/data/crm-leads.ts`
- `lib/data/arte-briefs.ts`
- `lib/data/video-scripts.ts`
- `lib/data/monthly-plannings.ts`

### 2. Bibliotecas Removidas

- `pg` (v8.18.0) - Driver PostgreSQL removido
- `pg-native` (latest) - Extensão nativa removida

Essas dependências não são mais necessárias pois toda a comunicação com o banco de dados agora vai através do Supabase.

### 3. Arquivos Deletados

- **`lib/db.ts`** - Arquivo que continha wrapper com Pool do PostgreSQL
- **`scripts/migrate-data.js`** - Script de migração de Supabase para PostgreSQL (não mais necessário)

## Padrões de Implementação

Todos os arquivos de dados agora seguem este padrão:

```typescript
import { createClient } from "@/lib/supabase/server"

export async function getData() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("table_name")
    .select("*")
  
  return data
}
```

### Principais Mudanças nos Padrões

1. **Queries com Filtros**: Utilizando `.eq()`, `.ilike()` do Supabase em vez de SQL manual
2. **Joins**: Usando o syntaxe de `select()` com relacionamentos
3. **Atualizações**: Chamadas `.update()` e `.insert()` ao invés de SQL parametrizado
4. **Transações**: Quando necessário, utilizar RPCs (stored procedures) do Supabase

## Benefícios

✅ **Segurança**: Row Level Security (RLS) nativo do Supabase  
✅ **Simplicidade**: SDK TypeScript type-safe  
✅ **Performance**: Usando edge functions do Supabase quando necessário  
✅ **Autenticação**: Integração nativa com Auth do Supabase  
✅ **Real-time**: Capacidade de usar real-time subscriptions  

## Verificações Realizadas

- ✓ Removidas todas as importações de `lib/db`
- ✓ Convertidas funções de query SQL para Supabase API
- ✓ Removidas dependências de PostgreSQL do package.json
- ✓ Deletados arquivos de migração PostgreSQL

## Próximos Passos

Se encontrar erros em desenvolvimento:

1. Verificar que as tabelas existem no Supabase
2. Validar Row Level Security (RLS) policies se necessário
3. Garantir que os nomes de tabelas e colunas correspondem ao schema do Supabase
4. Usar ferramentas de debug do Supabase para validar queries

O projeto agora está **100% integrado com Supabase** para persistência de dados.
