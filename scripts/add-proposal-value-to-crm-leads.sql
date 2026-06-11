-- Adiciona a coluna de valor da proposta na tabela crm_leads
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS proposal_value NUMERIC(12, 2) NOT NULL DEFAULT 0;
