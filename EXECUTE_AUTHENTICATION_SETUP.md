# 🔐 Como Executar o Script de Autenticação no Supabase

## Informações do seu Supabase

- **URL:** https://chatwoot-supabase.6gpkjl.easypanel.host
- **Status:** Customizado/Self-hosted via Easypanel

---

## Passo 1: Acessar o Supabase Dashboard

1. Abra seu browser e acesse: **https://chatwoot-supabase.6gpkjl.easypanel.host**
2. Faça login com suas credenciais

---

## Passo 2: Acessar o SQL Editor

1. No painel esquerdo, clique em **"SQL Editor"**
2. Clique em **"New Query"** ou **"New SQL"**

---

## Passo 3: Copiar e Executar o Script

1. Copie todo o conteúdo abaixo:

```sql
-- ============================================================================
-- SCRIPT DE AUTENTICAÇÃO - ADICIONA SENHA E FUNÇÕES RPC
-- ============================================================================

-- 1. Adicionar coluna de senha na tabela users (se não existir)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- 2. Criar função para fazer hash da senha usando pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Função RPC para autenticar usuário
CREATE OR REPLACE FUNCTION public.authenticate_user(p_email VARCHAR, p_password VARCHAR)
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  name VARCHAR,
  role VARCHAR,
  area VARCHAR,
  modules_access TEXT[],
  authenticated BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.area,
    u.modules_access,
    (u.password_hash IS NOT NULL AND u.password_hash = crypt(p_password, u.password_hash)) as authenticated
  FROM public.users u
  WHERE u.email = p_email 
    AND u.status = 'Ativo'
    AND u.password_hash = crypt(p_password, u.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função RPC para resetar senha
CREATE OR REPLACE FUNCTION public.reset_user_password(p_email VARCHAR, p_new_password VARCHAR)
RETURNS TABLE (
  success BOOLEAN,
  message VARCHAR
) AS $$
DECLARE
  v_user_id UUID;
  v_user_exists BOOLEAN;
BEGIN
  -- Verificar se o usuário existe
  SELECT id INTO v_user_id
  FROM public.users
  WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false::BOOLEAN, 'Email não encontrado'::VARCHAR;
    RETURN;
  END IF;

  -- Atualizar a senha
  UPDATE public.users
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE id = v_user_id;

  RETURN QUERY SELECT true::BOOLEAN, 'Senha resetada com sucesso'::VARCHAR;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Dar permissões para o role 'anon' chamar essas funções
GRANT EXECUTE ON FUNCTION public.authenticate_user(VARCHAR, VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION public.reset_user_password(VARCHAR, VARCHAR) TO anon;
```

2. Cole o script na janela de SQL Editor
3. Clique em **"Run"** ou pressione **Ctrl+Enter**

---

## Passo 4: Configurar Senhas dos Usuários

Após executar o script anterior, execute este comando para definir senhas:

```sql
-- Exemplo: Defina uma senha para seu usuário
UPDATE public.users 
SET password_hash = crypt('sua_senha_segura', gen_salt('bf'))
WHERE email = 'seu@email.com';

-- Ou para todos os usuários com uma senha padrão (não recomendado):
UPDATE public.users 
SET password_hash = crypt('senha123', gen_salt('bf'))
WHERE password_hash IS NULL;
```

⚠️ **Importante:** Substitua `'sua_senha_segura'` e `'seu@email.com'` com valores reais.

---

## Passo 5: Testar o Login

1. Volte para sua aplicação
2. Acesse a página de login em: `/auth/login`
3. Use suas credenciais (email e senha que configurou no Passo 4)

---

## ✅ Checklist

- [ ] Acessei o Supabase Dashboard
- [ ] Abri o SQL Editor
- [ ] Executei o script de autenticação completo
- [ ] Configurei a senha para meu usuário
- [ ] Testei o login na aplicação

---

## 🆘 Problemas Comuns

### Erro: "Column already exists"
**Causa:** A coluna `password_hash` já existe.
**Solução:** Isso é normal! O script usa `IF NOT EXISTS` para evitar erros. Continue.

### Erro: "Extension pgcrypto already exists"
**Causa:** A extensão já foi criada.
**Solução:** Isso é normal! Continue com os próximos comandos.

### Erro: "Permission denied"
**Causa:** Você pode estar usando a conta errada.
**Solução:** Certifique-se de que está logado com uma conta admin/super user.

### Login não funciona após setup
**Causa:** Senha não foi configurada ou usuário não está ativo.
**Solução:** Execute o Passo 4 novamente e verifique que `status = 'Ativo'`.

---

## 📝 Notas Técnicas

- **Hash de Senha:** Usamos bcrypt via `pgcrypto` do PostgreSQL
- **Segurança:** As funções RPC são `SECURITY DEFINER` para execução segura
- **Permissões:** Tanto o role `anon` quanto `authenticated` podem chamar as funções

---

## 🚀 Próximos Passos

Após concluir o setup:

1. Deploy sua aplicação
2. Notifique seus usuários sobre suas senhas
3. Considere implementar "esqueceu senha?" para autossuficiência

---

**Criado:** 2024
**Status:** Pronto para uso
