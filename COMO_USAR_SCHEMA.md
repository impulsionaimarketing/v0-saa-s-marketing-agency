# Como Usar o Schema Completo

## 1. Onde Encontrar o Schema

O arquivo `SCHEMA_COMPLETO.sql` contém **TUDO** que você precisa:
- ✅ Todas as 14 tabelas
- ✅ Todos os índices (28 índices)
- ✅ Todas as funções (4 funções)
- ✅ Todos os triggers (3 triggers)
- ✅ Comentários sobre RLS do Supabase

**Arquivo:** `/scripts/SCHEMA_COMPLETO.sql`

---

## 2. Passo a Passo: Criar o Banco

### Se estiver usando Supabase:

1. **Abra o SQL Editor** do Supabase
2. **Copie todo o conteúdo** de `SCHEMA_COMPLETO.sql`
3. **Cole no editor**
4. **Clique em "Run"** (ou Ctrl + Enter)
5. ✅ Pronto! Todas as tabelas foram criadas

### Se estiver usando PostgreSQL direto:

```bash
psql postgresql://usuario:senha@host:porta/database < SCHEMA_COMPLETO.sql
```

Ou via cliente pgAdmin/DBeaver:
1. Abra o cliente
2. Copie e cole o conteúdo
3. Execute

---

## 3. Adicionar Dados

### Opção A: Usar o script de migração (se tiver dados no Supabase antigo)

```bash
node scripts/migrate-data.js
```

### Opção B: Inserir dados manualmente

#### Exemplo 1: Adicionar um Usuário

```sql
INSERT INTO public.users (name, email, role, status)
VALUES 
  ('João Silva', 'joao@agencia.com', 'Admin', 'Ativo'),
  ('Maria Santos', 'maria@agencia.com', 'Gestor', 'Ativo'),
  ('Pedro Oliveira', 'pedro@agencia.com', 'Colaborador', 'Ativo');
```

#### Exemplo 2: Adicionar Áreas a um Usuário

```sql
-- Obter o ID do usuário primeiro
SELECT id FROM public.users WHERE email = 'joao@agencia.com';

-- Depois adicionar áreas
INSERT INTO public.user_areas (user_id, area)
VALUES 
  ('uuid-do-joao', 'Arte'),
  ('uuid-do-joao', 'Vídeo');
```

#### Exemplo 3: Adicionar um Cliente

```sql
INSERT INTO public.clients 
(name, type, campaign_type, plan, monthly_value, contract_status, month_status)
VALUES 
  ('Tech Solutions', 'Serviço', 'Mensagem', 'Premium', 5000.00, 'Ativo', 'green'),
  ('Loja Fashion', 'Local', 'Venda', 'Básico', 2500.00, 'Ativo', 'yellow'),
  ('Curso Online Pro', 'Infoproduto', 'Venda', 'Avançado', 8000.00, 'Ativo', 'green');
```

#### Exemplo 4: Atribuir Responsáveis por Cliente

```sql
-- Primeiro get os IDs
SELECT id FROM public.users WHERE email = 'joao@agencia.com'; -- admin
SELECT id FROM public.clients WHERE name = 'Tech Solutions';

-- Depois atribuir
INSERT INTO public.client_responsibles (client_id, user_id, area)
VALUES 
  ('uuid-tech-solutions', 'uuid-joao', 'Arte'),
  ('uuid-tech-solutions', 'uuid-maria', 'Vídeo'),
  ('uuid-tech-solutions', 'uuid-pedro', 'Tráfego');
```

#### Exemplo 5: Adicionar uma Demanda

```sql
INSERT INTO public.demands 
(name, description, client_id, area, status, priority, deadline)
SELECT 
  'Criar posts para Instagram',
  'Desenvolver 10 posts para o feed',
  c.id,
  'Arte',
  'A Fazer',
  'high',
  CURRENT_DATE + INTERVAL '7 days'
FROM public.clients c 
WHERE c.name = 'Tech Solutions';
```

**Nota:** A demanda vai automaticamente criar uma production (por causa do trigger)!

#### Exemplo 6: Adicionar Planejamento Mensal

```sql
-- Usando a função upsert (atualiza se já existe)
SELECT upsert_monthly_planning(
  'uuid-do-cliente',
  5,              -- Maio
  2026,           -- 2026
  10,             -- 10 vídeos
  20,             -- 20 artes
  5,              -- 5 campanhas de tráfego
  15              -- 15 comunicações
);
```

---

## 4. Verificar os Dados

### Ver todas as tabelas criadas:

```sql
-- Supabase: View → Database → public
-- PostgreSQL:
SELECT * FROM information_schema.tables WHERE table_schema = 'public';
```

### Ver dados em cada tabela:

```sql
SELECT * FROM public.users;
SELECT * FROM public.clients;
SELECT * FROM public.demands;
SELECT * FROM public.productions;
SELECT * FROM public.payments;
SELECT COUNT(*) FROM public.users;
```

### Ver índices criados:

```sql
SELECT * FROM pg_indexes WHERE schemaname = 'public';
```

---

## 5. Usar no Código (lib/data/)

O projeto já tem data layers preparados que usam essas tabelas:

### Em um Server Component:

```typescript
import { getClients } from '@/lib/data/clients'

export default async function MyPage() {
  const clients = await getClients()
  
  return (
    <div>
      {clients.map(client => (
        <div key={client.id}>{client.name}</div>
      ))}
    </div>
  )
}
```

### Em um Action Server:

```typescript
import { createDemand } from '@/lib/data/demands'

export async function createNewDemand(formData: FormData) {
  const demand = await createDemand({
    name: formData.get('name'),
    client_id: formData.get('client_id'),
    area: formData.get('area'),
    deadline: formData.get('deadline'),
  })
  
  return demand
}
```

---

## 6. Se Usar Supabase: Ativar RLS

Se você está usando **Supabase** e quer segurança com Row Level Security:

1. Abra `SCHEMA_COMPLETO.sql`
2. Procure por **"PARTE 4: ROW LEVEL SECURITY"**
3. Descomente todas as linhas ali
4. Execute no SQL Editor do Supabase

**Isso vai:**
- Ativar RLS em todas as 14 tabelas
- Criar políticas permissivas básicas
- Garantir que apenas usuários autenticados acessem

---

## 7. Estrutura de Pastas

Depois de executar o schema, sua estrutura fica assim:

```
projeto/
├── lib/
│   ├── db.ts                    # Conexão com PostgreSQL
│   ├── data/
│   │   ├── clients.ts           # Queries de clientes
│   │   ├── users.ts             # Queries de usuários
│   │   ├── demands.ts           # Queries de demandas
│   │   ├── alerts.ts            # Queries de alertas
│   │   └── ... (mais arquivos)
│   └── supabase/
│       ├── client.ts            # Cliente Supabase (se usar)
│       └── server.ts            # Servidor Supabase (se usar)
├── scripts/
│   ├── SCHEMA_COMPLETO.sql      # Schema completo
│   ├── migrate-data.js          # Script de migração
│   └── ... (outros scripts)
└── MAPA_BANCO_DADOS.md          # Este arquivo
```

---

## 8. Troubleshooting

### Erro: "table already exists"
Significa que você rodou o script duas vezes. Use:
```sql
DROP TABLE IF EXISTS public.tabela CASCADE;
```

### Erro: "constraint violation"
Você tentou inserir dados inválidos. Verifique:
- UUIDs válidos (copy correto do ID)
- Valores nos CHECKs (role, status, etc)
- Foreign keys existem

### Erro: "foreign key constraint failed"
Você tentou inserir com um ID que não existe:
```sql
-- Verifique se o ID existe primeiro
SELECT id FROM public.users WHERE id = 'seu-uuid';

-- Se não aparecer nada, crie o usuário primeiro
INSERT INTO public.users (name, email, role) VALUES (...);
```

### Dados não aparecem
- Verifique se executou o INSERT
- Faça um SELECT para confirmar
- Verifique filters/WHERE clauses

---

## 9. Próximas Ações

### ✅ Tarefas Imediatas:
1. Execute `SCHEMA_COMPLETO.sql` no seu banco
2. Adicione dados usando os exemplos acima
3. Teste a aplicação

### ✅ Tarefas Futuras:
1. Se usar Supabase, ative RLS
2. Configure backups automáticos
3. Crie índices adicionais se precisar
4. Monitore performance

---

## 10. Resumo do Que Você Tem

| Item | Descrição |
|------|-----------|
| **14 Tabelas** | Todas as tabelas principais |
| **28 Índices** | Para melhor performance |
| **3 Triggers** | Automação (demand→production, etc) |
| **4 Funções** | Upsert, sincronização, etc |
| **Data Layers** | JavaScript para consultar dados |
| **Documentação** | Este arquivo + MAPA_BANCO_DADOS.md |

---

## 11. Dúvidas?

- **Faltou tabela?** Verifique `MAPA_BANCO_DADOS.md`
- **Qual é a relação entre X e Y?** Veja "Relacionamentos Visuais"
- **Como inserir dados?** Veja "Adicionar Dados" acima
- **Quer migrar do Supabase antigo?** Use `scripts/migrate-data.js`

---

**Você tem TUDO pronto! Só falta adicionar os dados!** 🚀
