-- =============================================
-- ADD PASSWORD_HASH AND MODULES_ACCESS TO USERS
-- =============================================

-- Adicionar coluna password_hash se não existir
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Adicionar coluna modules_access se não existir
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS modules_access TEXT[] DEFAULT ARRAY[]::TEXT[];
