# 🔐 Instruções de Setup de Autenticação

## Status Atual ✅

- ✅ Tabela `users` já existe com coluna `password_hash`
- ✅ Script SQL pronto: `scripts/add-authentication.sql`
- ✅ Código de login melhorado
- ✅ Datas de demandas corrigidas

## O que Precisa Ser Feito

Executar o script SQL para criar as funções RPC de autenticação no seu Supabase.

## Como Executar o Script

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse seu Supabase: https://chatwoot-supabase.6gpkjl.easypanel.host/
2. Vá para **SQL Editor** → **New Query**
3. Copie todo o conteúdo do arquivo `scripts/add-authentication.sql`
4. Cole no editor
5. Clique em **Run** (ou Ctrl+Enter)

O script vai:
- Habilitar a extensão `pgcrypto` para hash de senhas
- Criar função `authenticate_user()` - autentica email/senha
- Criar função `reset_user_password()` - reseta senha
- Conceder permissões para usuários anônimos chamar essas funções

### Opção 2: Via Linha de Comando (psql)

```bash
# Conecte ao seu Supabase usando psql
psql -h chatwoot-supabase.6gpkjl.easypanel.host -U postgres -d postgres

# Cole o conteúdo do arquivo scripts/add-authentication.sql
```

## Próximo Passo: Criar Senha para Usuários

Depois de executar o script, adicione senhas para seus usuários:

```sql
-- Exemplo: Adicionar senha para o usuário admin@example.com
UPDATE public.users 
SET password_hash = crypt('senha123', gen_salt('bf'))
WHERE email = 'admin@example.com';
```

**Importante:** Use `crypt()` com `gen_salt('bf')` para garantir que o hash seja criado corretamente.

## Testando o Login

1. Acesse a página de login da aplicação
2. Use suas credenciais (email + senha que você configurou)
3. Se tudo estiver correto, será redirecionado para o dashboard

## Troubleshooting

### Erro: "Email ou senha incorretos"
- Verifique se a senha foi criada corretamente com `crypt()`
- Certifique-se de que o usuário tem `status = 'Ativo'`

### Erro: "Erro ao conectar"
- Verifique se as funções RPC foram criadas com sucesso
- Verifique se o header Authorization está correto

### Erro: "Erro ao resetar senha"
- Certifique-se de que o email existe no banco
- Verifique se o usuário está Ativo

## Arquivos Modificados

- `scripts/add-authentication.sql` - Script SQL para criar funções RPC
- `app/auth/login/page.tsx` - Melhorado tratamento de erros
- `components/demands/demands-kanban.tsx` - Corrigido parsing de datas
- `package.json` - Adicionado script `setup:auth`

## Suporte

Caso haja dúvidas, revise:
1. `EXECUTE_AUTHENTICATION_SETUP.md` - Guia passo-a-passo detalhado
2. `AUTHENTICATION_SETUP.md` - Documentação técnica
3. `scripts/add-authentication.sql` - O script SQL em si
