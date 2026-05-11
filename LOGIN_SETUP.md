# Guia de Setup da Coluna de Senha

Para que o login funcione, é necessário adicionar a coluna `password_hash` à tabela `users`.

## Passo 1: Adicionar a coluna ao Supabase

Execute o seguinte SQL no seu Supabase (URL: https://chatwoot-supabase.6gpkjl.easypanel.host/):

```sql
-- Adicionar coluna password_hash à tabela users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
```

## Passo 2: Criar usuários de teste com senha

Execute os seguintes comandos para criar usuários de teste:

```sql
-- Instalar a extensão pgcrypto se não estiver instalada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criar hash de senha com bcryptjs
-- Para criar hashes, use: npm run hash-password "sua_senha"
-- Aqui estamos usando um hash de exemplo (senha: "123456")

INSERT INTO public.users (id, name, email, password_hash, role, status)
VALUES (
  gen_random_uuid(),
  'Usuário Teste',
  'teste@example.com',
  -- Use o hash gerado pela função abaixo
  '$2a$10$Zx5aX7vYz5pB1mK8nQ2jPehK5c5a5b5c5d5e5f5g5h5i5j5k5l5m5n5',
  'Admin',
  'Ativo'
)
ON CONFLICT DO NOTHING;
```

## Passo 3: Gerar hashes de senha

Para gerar um hash de senha use este script:

```bash
node -e "
const bcryptjs = require('bcryptjs');
bcryptjs.hash('sua_senha_aqui', 10, (err, hash) => {
  if (err) console.error(err);
  console.log('Hash:', hash);
});
"
```

Substitua `sua_senha_aqui` pela senha desejada e copie o hash resultante.

## Passo 4: Testar o login

1. Acesse a página de login
2. Use o email e senha do usuário que você criou
3. Se tudo estiver configurado, você será redirecionado para o dashboard

## Alternativa: Criar usuários via API

Você também pode criar um usuário de teste através de uma request POST para `/api/create-test-user`.

Envie:
```json
{
  "email": "seu@email.com",
  "password": "sua_senha",
  "name": "Seu Nome"
}
```

## Troubleshooting

- **"Usuário não tem senha configurada"**: Significa que a coluna existe mas o usuário não tem hash de senha. Use o SQL acima para adicionar.
- **"Erro ao fazer login"**: Verifique se a coluna `password_hash` foi criada corretamente com `SELECT * FROM information_schema.columns WHERE table_name='users';`
- **Senha incorreta mesmo com dados certos**: Certifique-se de que o hash foi gerado com bcryptjs (começa com `$2a$` ou `$2b$`)
