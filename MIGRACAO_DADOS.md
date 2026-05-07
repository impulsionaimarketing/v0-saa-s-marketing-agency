# Guia Completo de Migração de Dados

## 📋 Opções de Migração

Existem **3 formas principais** de migrar os dados do Supabase para PostgreSQL:

### 1️⃣ Script Automático (Recomendado)
**Melhor para:** Migração completa, dados estruturados
**Tempo:** ~5 minutos
**Complexidade:** Baixa

```bash
node scripts/migrate-data.js
```

**Vantagens:**
- Totalmente automatizado
- Mantém IDs originais
- Evita duplicatas com `ON CONFLICT`
- Logs detalhados

**Desvantagens:**
- Requer Node.js
- Precisa de acesso às credenciais

---

### 2️⃣ Export/Import via CSV
**Melhor para:** Dados pequenos a médios, backup
**Tempo:** ~10-20 minutos
**Complexidade:** Média

#### Passo A: Exportar do Supabase

**Método 1 - Via pgAdmin (Supabase)**
1. Acesse pgAdmin do seu projeto Supabase
2. Clique com botão direito na tabela
3. Selecione "Backup" ou "Export"
4. Salve como CSV

**Método 2 - Via psql**
```bash
# Conecte ao Supabase
psql postgresql://[user]:[password]@db.xxx.supabase.co:5432/postgres

# Exporte cada tabela
\COPY users TO 'users.csv' WITH CSV HEADER
\COPY clients TO 'clients.csv' WITH CSV HEADER
\COPY demands TO 'demands.csv' WITH CSV HEADER
\COPY alerts TO 'alerts.csv' WITH CSV HEADER
\COPY client_responsibles TO 'client_responsibles.csv' WITH CSV HEADER
```

**Método 3 - Via SQL Query**
```sql
-- No SQL Editor do Supabase, execute:
SELECT * FROM users;
-- Clique em "Download as CSV"
-- Repita para cada tabela
```

#### Passo B: Importar no PostgreSQL

```bash
# Conecte ao seu PostgreSQL
psql postgresql://[user]:[password]@[host]:5432/[database]

# Importe as tabelas (ORDEM IMPORTA!)
\COPY users FROM 'users.csv' WITH CSV HEADER
\COPY client_responsibles FROM 'client_responsibles.csv' WITH CSV HEADER
\COPY clients FROM 'clients.csv' WITH CSV HEADER
\COPY demands FROM 'demands.csv' WITH CSV HEADER
\COPY alerts FROM 'alerts.csv' WITH CSV HEADER
```

**Importante:** Importe nesta ordem:
1. `users` (não tem dependências)
2. `client_responsibles` (precisa de users)
3. `clients` (não tem dependências)
4. `demands` (precisa de clients e users)
5. `alerts` (precisa de clients)

---

### 3️⃣ Usando SQL Direto
**Melhor para:** Controle total, transformações de dados
**Tempo:** ~30 minutos
**Complexidade:** Alta

```sql
-- Conecte ao seu PostgreSQL e execute:

-- 1. Inserir usuários
INSERT INTO users (id, name, email, role, area, status, avatar_url, created_at, updated_at)
SELECT id, name, email, role, area, status, avatar_url, created_at, updated_at
FROM dblink('postgresql://[credentials]@db.supabase.co/postgres',
  'SELECT id, name, email, role, area, status, avatar_url, created_at, updated_at FROM users')
AS t(id uuid, name text, email text, role text, area text, status text, avatar_url text, created_at timestamp, updated_at timestamp)
ON CONFLICT (id) DO NOTHING;

-- 2. Inserir clientes
INSERT INTO clients (id, name, type, campaign_type, plan, monthly_value, contract_status, status, created_at, updated_at)
SELECT id, name, type, campaign_type, plan, monthly_value, contract_status, status, created_at, updated_at
FROM dblink('postgresql://[credentials]@db.supabase.co/postgres',
  'SELECT id, name, type, campaign_type, plan, monthly_value, contract_status, status, created_at, updated_at FROM clients')
AS t(id uuid, name text, type text, campaign_type text, plan text, monthly_value numeric, contract_status text, status text, created_at timestamp, updated_at timestamp)
ON CONFLICT (id) DO NOTHING;

-- ... (continuar para outras tabelas)
```

---

## 🔄 Comparação das Opções

| Aspecto | Script Automático | CSV | SQL Direto |
|---------|-------------------|-----|-----------|
| **Tempo** | ⚡ 5 min | ⏱️ 15 min | 🐢 30+ min |
| **Facilidade** | ✅ Muito fácil | ✅ Fácil | ⚠️ Complexo |
| **Confiabilidade** | ✅ Alta | ⚠️ Média | ✅ Alta |
| **Controle** | ⚠️ Baixo | ⚠️ Médio | ✅ Total |
| **Transformação dados** | ❌ Não | ⚠️ Com processamento | ✅ Sim |
| **Recomendado** | ✅ SIM | ✅ Para backup | ⚠️ Avançado |

---

## ✅ Checklist Pré-Migração

Antes de migrar, certifique-se de:

- [ ] PostgreSQL está acessível e funcionando
- [ ] `scripts/postgres-setup.sql` foi executado
- [ ] `DATABASE_URL` está configurada corretamente
- [ ] Você tem um backup dos dados do Supabase
- [ ] Não há usuários usando o sistema durante a migração

---

## 🧪 Validar Migração

Após a migração, execute estas verificações:

```bash
# Conecte ao PostgreSQL
psql [DATABASE_URL]

# Verifique contagens
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'demands', COUNT(*) FROM demands
UNION ALL
SELECT 'alerts', COUNT(*) FROM alerts
UNION ALL
SELECT 'client_responsibles', COUNT(*) FROM client_responsibles;

# Verifique integridade referencial
SELECT c.id, c.name, COUNT(d.id) as demand_count
FROM clients c
LEFT JOIN demands d ON d.client_id = c.id
GROUP BY c.id, c.name
LIMIT 10;
```

Compare os resultados com o Supabase:

```sql
-- No Supabase, execute as mesmas queries
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM clients;
-- etc...
```

---

## 🚨 Troubleshooting

### Erro: "Foreign key violation"

**Causa:** Você está importando em ordem errada (usa FK antes de criar o registro)

**Solução:** Importe nesta ordem:
1. users
2. clients
3. demands
4. alerts
5. client_responsibles

---

### Erro: "Duplicate key value violates unique constraint"

**Causa:** Dados duplicados ou IDs já existem

**Solução:**
```sql
-- Use TRUNCATE antes de re-importar
TRUNCATE users CASCADE;
TRUNCATE clients CASCADE;
-- etc...

-- Depois reimporte
```

---

### Erro: "Permission denied"

**Causa:** Usuário PostgreSQL sem permissões

**Solução:**
```sql
-- Como admin, execute:
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO seu_usuario;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO seu_usuario;
```

---

### Dados não aparecem após migração

**Checklist:**
1. Execute a query de validação acima
2. Verifique se a `DATABASE_URL` aponta para o BD certo
3. Verifique se as tabelas existem: `\dt` (psql)
4. Limpe cache da aplicação (Ctrl+Shift+Delete)

---

## 📞 Precisando de Ajuda?

Se a migração não funcionar:

1. **Verifique os logs:** Console (F12) do navegador
2. **Teste a conexão:** `psql [DATABASE_URL]`
3. **Valide os dados:** Execute a query de validação
4. **Me chame:** Posso revisar e corrigir

---

**Escolha a opção que funciona melhor para você e comece!** 🚀
