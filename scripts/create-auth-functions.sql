-- =============================================
-- AUTHENTICATION FUNCTIONS
-- =============================================

-- Função para autenticar usuário
CREATE OR REPLACE FUNCTION authenticate_user(
  p_email VARCHAR,
  p_password VARCHAR
)
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  name VARCHAR,
  role VARCHAR,
  area VARCHAR,
  authenticated BOOLEAN,
  modules_access TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.area,
    CASE 
      WHEN u.password_hash IS NOT NULL AND crypt(p_password, u.password_hash) = u.password_hash THEN TRUE
      ELSE FALSE
    END as authenticated,
    COALESCE(u.modules_access, ARRAY[]::TEXT[]) as modules_access
  FROM public.users u
  WHERE u.email = p_email;
END;
$$ LANGUAGE plpgsql;

-- Função para criar novo usuário
CREATE OR REPLACE FUNCTION create_new_user(
  p_name VARCHAR,
  p_email VARCHAR,
  p_password VARCHAR,
  p_role VARCHAR,
  p_area VARCHAR
)
RETURNS TABLE (
  success BOOLEAN,
  user_id UUID,
  message VARCHAR
) AS $$
DECLARE
  v_user_id UUID;
  v_password_hash TEXT;
BEGIN
  -- Verificar se usuário já existe
  IF EXISTS (SELECT 1 FROM public.users WHERE email = p_email) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Email já cadastrado'::VARCHAR;
    RETURN;
  END IF;

  -- Hash da senha
  v_password_hash := crypt(p_password, gen_salt('bf'));

  -- Inserir novo usuário
  INSERT INTO public.users (name, email, role, area, password_hash, status)
  VALUES (p_name, p_email, p_role, p_area, v_password_hash, 'Ativo')
  RETURNING public.users.id INTO v_user_id;

  RETURN QUERY SELECT TRUE, v_user_id, 'Usuário criado com sucesso'::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- Função para resetar senha
CREATE OR REPLACE FUNCTION reset_user_password(
  p_email VARCHAR,
  p_new_password VARCHAR
)
RETURNS TABLE (
  success BOOLEAN,
  message VARCHAR
) AS $$
DECLARE
  v_password_hash TEXT;
  v_user_id UUID;
BEGIN
  -- Encontrar usuário
  SELECT id INTO v_user_id FROM public.users WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Email não encontrado'::VARCHAR;
    RETURN;
  END IF;

  -- Hash da nova senha
  v_password_hash := crypt(p_new_password, gen_salt('bf'));

  -- Atualizar senha
  UPDATE public.users 
  SET password_hash = v_password_hash, updated_at = NOW()
  WHERE id = v_user_id;

  RETURN QUERY SELECT TRUE, 'Senha atualizada com sucesso'::VARCHAR;
END;
$$ LANGUAGE plpgsql;
