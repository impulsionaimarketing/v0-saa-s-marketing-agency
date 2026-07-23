-- =====================================================================
-- Stories Automáticos: ordem de publicação (Drag & Drop / modo Sequencial)
-- Adiciona a coluna `position` em story_contents.
-- Idempotente: pode ser rodado mais de uma vez sem erro.
-- =====================================================================

-- 1. Coluna position (ordem de publicação). Nunca usar created_at para ordenar.
ALTER TABLE story_contents
  ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;

-- 2. Índice para acelerar a ordenação por pasta.
CREATE INDEX IF NOT EXISTS idx_story_contents_folder_position
  ON story_contents (folder_id, position);

-- 3. Inicializa a posição das mídias já existentes, por pasta, preservando a
--    ordem atual (created_at ASC). Assim nada fica com position = 0 empilhado.
WITH ordered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY company_id, folder_id
      ORDER BY created_at ASC
    ) AS rn
  FROM story_contents
)
UPDATE story_contents sc
SET position = ordered.rn
FROM ordered
WHERE sc.id = ordered.id;
