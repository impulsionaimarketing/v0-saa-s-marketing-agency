# Configuração de Autenticação - Próximos Passos

## O Problema
O sistema de login estava tentando chamar funções RPC (`authenticate_user` e `reset_user_password`) que não existiam no Supabase.

## A Solução
Criei um script SQL (`scripts/add-authentication.sql`) que:

1. Adiciona uma coluna `password_hash` na tabela `users`
2. Cria a função RPC `authenticate_user` para validar email/senha
3. Cria a função RPC `reset_user_password` para redefinir senhas
4. Concede permissões adequadas

## Como Executar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Abra seu projeto Supabase em https://supabase.com/dashboard
2. Vá para **SQL Editor**
3. Clique em **New Query**
4. Copie o conteúdo de `/scripts/add-authentication.sql`
5. Cole no editor
6. Clique em **Run**

### Opção 2: Via Terminal (psql)

```bash
psql $DATABASE_URL -f scripts/add-authentication.sql
```

## Próximos Passos Após Executar o Script

1. **Adicionar Senhas aos Usuários**
   - Você precisa definir senhas para os usuários existentes
   - Descomente e execute a última seção do script, ou use:

```sql
UPDATE public.users 
SET password_hash = crypt('sua_senha_aqui', gen_salt('bf'))
WHERE email = 'usuario@email.com';
```

2. **Testar Login**
   - Abra a página de login
   - Use as credenciais que você configurou
   - A autenticação agora deve funcionar

## Estrutura das Funções RPC

### authenticate_user(p_email, p_password)
**Entrada:**
- `p_email`: Email do usuário
- `p_password`: Senha do usuário

**Saída:**
- `id`: UUID do usuário
- `email`: Email do usuário
- `name`: Nome do usuário
- `role`: Cargo (Admin, Gestor, Colaborador)
- `area`: Área (Arte, Vídeo, Tráfego, Comunicação)
- `modules_access`: Array de módulos que o usuário pode acessar
- `authenticated`: Boolean indicando se autenticação foi bem-sucedida

### reset_user_password(p_email, p_new_password)
**Entrada:**
- `p_email`: Email do usuário
- `p_new_password`: Nova senha

**Saída:**
- `success`: Boolean indicando sucesso
- `message`: Mensagem descritiva

## Segurança

- Todas as senhas são armazenadas com hash bcrypt (`crypt()`)
- A função não armazena senhas em texto plano
- As funções RPC usam `SECURITY DEFINER` para executar com privilégios apropriados

## Troubleshooting

**Erro: "function authenticate_user does not exist"**
- O script SQL não foi executado. Execute-o via Supabase Dashboard.

**Erro: "Email ou senha incorretos"**
- Verifique se a senha foi definida para o usuário
- Confirme que o usuário tem `status = 'Ativo'` na tabela

**Erro: "Email não encontrado" ao resetar senha**
- O email pode não estar registrado ou há um typo
