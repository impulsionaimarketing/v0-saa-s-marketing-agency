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

-- 6. Fazer hash das senhas existentes (se houver um campo de senha temporário)
-- Você pode descomentir e executar isto depois se necessário:
-- UPDATE public.users 
-- SET password_hash = crypt('default_password_123', gen_salt('bf'))
-- WHERE password_hash IS NULL;
