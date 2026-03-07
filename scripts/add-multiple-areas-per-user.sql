-- Adicionar suporte para múltiplas áreas por colaborador

-- 1. Criar tabela de junção para user_areas
CREATE TABLE IF NOT EXISTS public.user_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  area VARCHAR(50) NOT NULL CHECK (area IN ('Arte', 'Vídeo', 'Tráfego', 'Comunicação')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, area)
);

-- 2. Migrar dados existentes da coluna area para a tabela user_areas
INSERT INTO public.user_areas (user_id, area)
SELECT id, area FROM public.users WHERE area IS NOT NULL
ON CONFLICT (user_id, area) DO NOTHING;

-- 3. Remover a constraint de area única da tabela users
ALTER TABLE public.users DROP COLUMN IF EXISTS area;

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_areas_user_id ON public.user_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_areas_area ON public.user_areas(area);
