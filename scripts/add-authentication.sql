-- ============================================================================
-- SCRIPT DE AUTENTICAÇÃO - CRIA FUNÇÕES RPC
-- ============================================================================
-- A tabela public.users já existe com a coluna password_hash

-- 1. Garantir que pgcrypto está habilitado
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Função RPC para autenticar usuário
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
DECLARE
  v_user_id UUID;
  v_email VARCHAR;
  v_name VARCHAR;
  v_role VARCHAR;
  v_area VARCHAR;
  v_modules_access TEXT[];
  v_password_hash VARCHAR;
  v_authenticated BOOLEAN;
BEGIN
  -- Buscar usuário por email
  SELECT u.id, u.email, u.name, u.role, u.area, u.modules_access, u.password_hash
  INTO v_user_id, v_email, v_name, v_role, v_area, v_modules_access, v_password_hash
  FROM public.users u
  WHERE u.email = p_email AND u.status = 'Ativo';

  -- Se não encontrou usuário, retornar com authenticated = false
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::TEXT[], false::BOOLEAN;
    RETURN;
  END IF;

  -- Verificar se a senha está correta
  v_authenticated := (v_password_hash = crypt(p_password, v_password_hash));

  RETURN QUERY SELECT v_user_id, v_email, v_name, v_role, v_area, v_modules_access, v_authenticated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função RPC para resetar senha
CREATE OR REPLACE FUNCTION public.reset_user_password(p_email VARCHAR, p_new_password VARCHAR)
RETURNS TABLE (
  success BOOLEAN,
  message VARCHAR
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se o usuário existe
  SELECT id INTO v_user_id
  FROM public.users
  WHERE email = p_email AND status = 'Ativo';

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false::BOOLEAN, 'Email não encontrado'::VARCHAR;
    RETURN;
  END IF;

  -- Atualizar a senha
  UPDATE public.users
  SET password_hash = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = v_user_id;

  RETURN QUERY SELECT true::BOOLEAN, 'Senha resetada com sucesso'::VARCHAR;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Dar permissões para o role 'anon' chamar essas funções
GRANT EXECUTE ON FUNCTION public.authenticate_user(VARCHAR, VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION public.reset_user_password(VARCHAR, VARCHAR) TO anon;

-- 5. Dar permissões para o role 'authenticated'
GRANT EXECUTE ON FUNCTION public.authenticate_user(VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_user_password(VARCHAR, VARCHAR) TO authenticated;
