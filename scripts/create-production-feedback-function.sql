-- Função para listar todas as alterações/comentários solicitados pelos clientes.
-- Usa SECURITY DEFINER para ignorar o RLS (mesmo padrão de get_all_productions),
-- já que as tabelas production_comments e production_approvals têm RLS ativo
-- e não possuem política de SELECT para o usuário logado.
--
-- COMO USAR: rode este script inteiro no SQL Editor do Supabase.

CREATE OR REPLACE FUNCTION get_production_feedback()
RETURNS TABLE (
  feedback_id uuid,
  production_id uuid,
  production_title text,
  production_status text,
  client_name text,
  thumbnail_url text,
  author text,
  comment text,
  is_client boolean,
  source text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Comentários da tabela production_comments
  SELECT
    pc.id AS feedback_id,
    pc.production_id,
    p.title AS production_title,
    p.status AS production_status,
    p.client_name,
    p.thumbnail_url,
    COALESCE(pc.author_name, 'Cliente') AS author,
    pc.comment,
    COALESCE(pc.is_client, true) AS is_client,
    'comment'::text AS source,
    pc.created_at
  FROM production_comments pc
  JOIN productions p ON p.id = pc.production_id
  WHERE pc.comment IS NOT NULL AND btrim(pc.comment) <> ''

  UNION ALL

  -- Comentários/decisões da tabela production_approvals
  SELECT
    pa.id AS feedback_id,
    pa.production_id,
    p.title AS production_title,
    p.status AS production_status,
    p.client_name,
    p.thumbnail_url,
    COALESCE(pa.approved_by, 'Cliente') AS author,
    pa.comment,
    true AS is_client,
    'approval'::text AS source,
    pa.created_at
  FROM production_approvals pa
  JOIN productions p ON p.id = pa.production_id
  WHERE pa.comment IS NOT NULL AND btrim(pa.comment) <> ''

  ORDER BY created_at DESC;
$$;

-- Permite que o app (papéis anon e authenticated) execute a função
GRANT EXECUTE ON FUNCTION get_production_feedback() TO anon, authenticated;
