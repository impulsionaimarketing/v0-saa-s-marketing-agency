MIGRAÇÃO FINAL - SUPABASE → NOVO BANCO

Este é o guia final para migrar TODAS as tabelas do seu Supabase atual.

## 3 PASSOS SIMPLES:

### PASSO 1: Criar as Tabelas no Novo Banco
```
No Supabase SQL Editor:
1. Abra: https://app.supabase.com/project/[seu-id]/sql
2. Copie o arquivo: SCHEMA_SUPABASE.sql (completo)
3. Cole no editor
4. Clique "Run"
```

OU no PostgreSQL:
```bash
psql postgresql://usuario:senha@host/database < SCHEMA_SUPABASE.sql
```

### PASSO 2: Migrar os DADOS
```bash
node scripts/migrate-data.js
```

Pré-requisitos:
- DATABASE_URL deve estar em .env.local ou Vars
- SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY também
- As tabelas já devem estar criadas (Passo 1)

O script vai:
✓ Conectar no Supabase antigo
✓ Exportar dados de: users, clients, demands, alerts, client_responsibles
✓ Importar no novo banco
✓ Evitar duplicatas com ON CONFLICT DO NOTHING

### PASSO 3: Verificar Dados
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM clients;
SELECT COUNT(*) FROM demands;
SELECT COUNT(*) FROM alerts;
SELECT COUNT(*) FROM client_responsibles;
```

Compare os números com seu Supabase antigo.

## TABELAS MIGRADAS (9 tabelas):
✓ users
✓ clients
✓ client_responsibles
✓ demands
✓ productions
✓ campaigns
✓ reports
✓ alerts
✓ activity_logs

## COLUNAS IMPORTANTES:
- users: modules_access (array)
- clients: whatsapp_instances (JSONB)
- productions: demand_id (relação com demands)

Tudo pronto! 🚀
