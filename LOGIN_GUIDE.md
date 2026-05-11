# Como Fazer Login no Sistema

## ✅ Login Já Está Configurado!

O schema do seu banco de dados já possui a coluna `password_hash`. Agora você só precisa criar um usuário de teste.

## 🔧 Criando um Usuário de Teste

### Opção 1: Via SQL Editor do Supabase (Recomendado)

1. Acesse seu Supabase: https://chatwoot-supabase.6gpkjl.easypanel.host/
2. Clique em **"SQL Editor"** no menu lateral
3. Clique em **"New Query"**
4. Cole este SQL:

```sql
INSERT INTO public.users (name, email, password_hash, role, status, area, modules_access)
VALUES (
  'Usuário Teste',
  'teste@example.com',
  '$2b$10$jhtqX/Wq4iIfJyXn8aZAmu4iF4nk12GvbPfQmzOHCwlsR5eUKdzNW',
  'Admin',
  'Ativo',
  'Administração',
  array['dashboard', 'clientes', 'colaboradores', 'demandas', 'producao', 'trafego', 'cobrancas', 'relatorios', 'alertas', 'configuracoes']
);
```

5. Clique em **"Run"** (Ctrl + Enter)
6. Pronto! Usuário criado.

### Opção 2: Via API (Dentro da aplicação)

```bash
curl -X POST http://localhost:3000/api/create-test-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123",
    "name": "Usuário Teste"
  }'
```

## 🔐 Credenciais de Teste

```
📧 Email:    teste@example.com
🔑 Senha:    senha123
👤 Nome:     Usuário Teste
🎭 Role:     Admin
📊 Acesso:   Todos os módulos
```

## 🚀 Fazendo Login

1. Acesse a página de login em: http://localhost:3000/auth/login
2. Digite o email: `teste@example.com`
3. Digite a senha: `senha123`
4. Clique em "Entrar"

## ✨ Funcionalidades Ativas

- ✅ Login com email e senha
- ✅ Expansão automática da tela ao fechar menu no desktop
- ✅ Botão para mostrar/ocultar todos os filtros de uma vez (desktop e mobile)
- ✅ Filtros de pagamento funcionando corretamente

## 🔑 Gerando Novos Hashes de Senha

Se precisar criar mais usuários, você pode gerar um novo hash:

```bash
node scripts/generate-password-hash.js
```

Isso vai gerar um novo hash que você pode usar no SQL.

## 📝 Notas

- O schema já tem a coluna `password_hash` configurada
- As senhas são criptografadas com bcryptjs
- O login usa server actions seguras
- Os cookies são HTTP-only para máxima segurança
- RLS está ativo na tabela users

## ❓ Problemas?

Se o login não funcionar:

1. **Verifique se o usuário existe**: No Supabase, vá em "Table Editor" e confira se há um registro na tabela `users`
2. **Verifique o password_hash**: Certifique-se de que o campo `password_hash` tem um valor (não null)
3. **Verifique o status**: O campo `status` deve ser "Ativo"
4. **Limpe o cache do navegador**: F12 → Application → Cookies → Delete all

