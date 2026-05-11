# Configuração de Autenticação

Para que o login funcione corretamente, você precisa executar os seguintes passos:

## 1. Executar Migrations

Execute os scripts SQL na seguinte ordem no **SQL Editor** do Supabase:

1. **scripts/add-auth-columns.sql** - Adiciona colunas necessárias à tabela users
2. **scripts/create-auth-functions.sql** - Cria as funções RPC de autenticação

## 2. Habilitar extensão pgcrypto

No SQL Editor do Supabase, execute:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## 3. Criar um usuário de teste

Execute o seguinte SQL:
```sql
INSERT INTO public.users (name, email, password_hash, role, area, status)
VALUES (
  'Admin Test',
  'admin@test.com',
  crypt('password123', gen_salt('bf')),
  'Admin',
  'Arte',
  'Ativo'
);
```

Agora você pode fazer login com:
- **Email**: admin@test.com
- **Senha**: password123

## 4. Verificar RLS Policies

Certifique-se de que as políticas RLS permitam que usuários anônimos possam chamar as funções RPC.

## Troubleshooting

Se o login não funcionar:
1. Verifique se as extensões foram habilitadas (`pgcrypto`)
2. Verifique se as funções RPC foram criadas com sucesso
3. Verifique se a coluna `password_hash` foi adicionada à tabela `users`
4. Procure por erros nos logs do navegador (F12)
