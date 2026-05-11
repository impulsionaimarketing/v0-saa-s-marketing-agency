# Como Criar Usuário de Teste para Login

## Problema
O Supabase autohospedado tem RLS (Row Level Security) ativado, então não conseguimos inserir usuários via aplicação com a anon key.

## Solução

### Opção 1: Via SQL Admin (Recomendado)

Se você tem acesso à interface SQL do Supabase autohospedado:

1. Acesse o SQL Editor do seu Supabase autohospedado
2. Execute este SQL:

```sql
INSERT INTO public.users (email, name, password_hash, role, status, area, modules_access)
VALUES (
  'teste@example.com',
  'Usuário Teste',
  '$2b$10$lyyV0LnQ4UHZLtQ63w0jl.UYGGHUXk9OY/sCOzorwDa.VDCKOxDwa',
  'Admin',
  'Ativo',
  'Administração',
  array['dashboard', 'clientes', 'colaboradores', 'demandas', 'producao', 'trafego', 'cobrancas', 'relatorios', 'alertas', 'configuracoes']
);
```

### Opção 2: Via Service Role Key

Se você tiver a **service_role_key** do seu Supabase autohospedado:

1. Edite o arquivo `scripts/insert-test-user.js`
2. Substitua `SUPABASE_ANON_KEY` por `SUPABASE_SERVICE_ROLE_KEY`
3. Execute: `node scripts/insert-test-user.js`

## Credenciais de Teste

Após inserir o usuário, faça login com:

- **Email**: `teste@example.com`
- **Senha**: `senha123`
- **Hash da Senha**: `$2b$10$lyyV0LnQ4UHZLtQ63w0jl.UYGGHUXk9OY/sCOzorwDa.VDCKOxDwa`

## Endereços Úteis

- Supabase Autohospedado: https://chatwoot-supabase.6gpkjl.easypanel.host/
- URL do Banco: https://chatwoot-supabase.6gpkjl.easypanel.host/
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE`
